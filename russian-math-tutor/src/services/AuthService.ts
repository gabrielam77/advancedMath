/**
 * AuthService — handles user registration, login, session management.
 *
 * Primary storage: MongoDB Atlas (when configured).
 * Fallback: localStorage (works offline / before MongoDB is set up).
 *
 * Passwords are hashed client-side with SHA-256 + random salt using
 * the browser's built-in Web Crypto API — no extra packages needed.
 */

import { UserProfile, UserCredentials } from '../types';
import { MongoDBService } from './MongoDBService';
import { StorageUtils } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: UserProfile;
}

interface MongoUser extends UserProfile, UserCredentials {
  hashVersion?: number;  // 1 = SHA-256 (legacy), 2 = PBKDF2 (current)
}

interface StoredSession {
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  createdAt: string;
  expiresAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_KEY = 'mth_session';
const SESSION_DAYS = 30;
const LS_USERS_KEY = 'mth_users_registry';   // fallback: array of MongoUser

// ─── AuthService ─────────────────────────────────────────────────────────────

export class AuthService {
  // ── Crypto ────────────────────────────────────────────────────────────────

  private static generateSalt(): string {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** PBKDF2-SHA-256, 100 000 iterations, 256-bit output (hashVersion 2). */
  static async hashPassword(password: string, salt: string): Promise<string> {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
      key, 256
    );
    return Array.from(new Uint8Array(bits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /** Legacy SHA-256 hash used by hashVersion 1 records — only for migration. */
  private static async hashPasswordLegacy(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static generateUserId(): string {
    return 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  static validateRegistration(
    username: string,
    password: string,
    confirmPassword: string,
    displayName: string
  ): string | null {
    if (!username.trim() || !password || !displayName.trim()) return 'כל השדות חובה';
    if (username.trim().length < 3) return 'שם המשתמש חייב להכיל לפחות 3 תווים';
    if (!/^[a-zA-Z0-9_\u0590-\u05FF]+$/.test(username.trim()))
      return 'שם המשתמש: אותיות, מספרים וקו תחתון בלבד';
    if (password.length < 4) return 'הסיסמה חייבת להכיל לפחות 4 תווים';
    if (password !== confirmPassword) return 'הסיסמאות אינן תואמות';
    if (displayName.trim().length < 2) return 'השם חייב להכיל לפחות 2 תווים';
    return null;
  }

  // ── Register ──────────────────────────────────────────────────────────────

  static async register(
    username: string,
    password: string,
    displayName: string,
    avatarEmoji: string
  ): Promise<AuthResult> {
    const clean = username.trim().toLowerCase();

    try {
      if (MongoDBService.isAvailable()) {
        return await this.registerMongo(clean, password, displayName.trim(), avatarEmoji);
      }
      return await this.registerLocal(clean, password, displayName.trim(), avatarEmoji);
    } catch (e) {
      console.error('Register error:', e);
      return { success: false, error: 'שגיאה ברישום, נסה שוב' };
    }
  }

  private static async registerMongo(
    username: string, password: string, displayName: string, avatarEmoji: string
  ): Promise<AuthResult> {
    const existing = await MongoDBService.findOne<MongoUser>('users', { username });
    if (existing) return { success: false, error: 'שם משתמש זה כבר תפוס' };

    const userId = this.generateUserId();
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const doc: MongoUser = {
      userId, username, displayName, avatarEmoji,
      createdAt: new Date().toISOString(),
      passwordHash, salt, hashVersion: 2,
    };
    await MongoDBService.insertOne('users', doc);

    const profile = this.docToProfile(doc);
    this.persistSession(profile);
    return { success: true, user: profile };
  }

  private static async registerLocal(
    username: string, password: string, displayName: string, avatarEmoji: string
  ): Promise<AuthResult> {
    const users = this.getLocalUsers();
    if (users.find(u => u.username === username))
      return { success: false, error: 'שם משתמש זה כבר תפוס' };

    const userId = this.generateUserId();
    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);

    const doc: MongoUser = {
      userId, username, displayName, avatarEmoji,
      createdAt: new Date().toISOString(),
      passwordHash, salt, hashVersion: 2,
    };
    users.push(doc);
    StorageUtils.set(LS_USERS_KEY, users);

    const profile = this.docToProfile(doc);
    this.persistSession(profile);
    return { success: true, user: profile };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  static async login(username: string, password: string): Promise<AuthResult> {
    const clean = username.trim().toLowerCase();
    try {
      if (MongoDBService.isAvailable()) {
        return await this.loginMongo(clean, password);
      }
      return await this.loginLocal(clean, password);
    } catch (e) {
      console.error('Login error:', e);
      return { success: false, error: 'שגיאה בכניסה, נסה שוב' };
    }
  }

  private static async loginMongo(username: string, password: string): Promise<AuthResult> {
    const user = await MongoDBService.findOne<MongoUser>('users', { username });
    if (!user) return { success: false, error: 'שם משתמש או סיסמה שגויים' };

    if (user.hashVersion === 2) {
      // Current algorithm — verify with PBKDF2
      const hash = await this.hashPassword(password, user.salt);
      if (hash !== user.passwordHash) return { success: false, error: 'שם משתמש או סיסמה שגויים' };
    } else {
      // Legacy SHA-256 record — verify then silently upgrade to PBKDF2
      const legacyHash = await this.hashPasswordLegacy(password, user.salt);
      if (legacyHash !== user.passwordHash) return { success: false, error: 'שם משתמש או סיסמה שגויים' };

      const newHash = await this.hashPassword(password, user.salt);
      await MongoDBService.updateOne(
        'users',
        { userId: user.userId },
        { $set: { passwordHash: newHash, hashVersion: 2 } },
        false
      );
    }

    const profile = this.docToProfile(user);
    this.persistSession(profile);
    return { success: true, user: profile };
  }

  private static async loginLocal(username: string, password: string): Promise<AuthResult> {
    const users = this.getLocalUsers();
    const user = users.find(u => u.username === username);
    if (!user) return { success: false, error: 'שם משתמש או סיסמה שגויים' };

    if (user.hashVersion === 2) {
      // Current algorithm — verify with PBKDF2
      const hash = await this.hashPassword(password, user.salt);
      if (hash !== user.passwordHash) return { success: false, error: 'שם משתמש או סיסמה שגויים' };
    } else {
      // Legacy SHA-256 record — verify then silently upgrade to PBKDF2
      const legacyHash = await this.hashPasswordLegacy(password, user.salt);
      if (legacyHash !== user.passwordHash) return { success: false, error: 'שם משתמש או סיסמה שגויים' };

      const newHash = await this.hashPassword(password, user.salt);
      const idx = users.findIndex(u => u.userId === user.userId);
      users[idx] = { ...users[idx], passwordHash: newHash, hashVersion: 2 };
      StorageUtils.set(LS_USERS_KEY, users);
    }

    const profile = this.docToProfile(user);
    this.persistSession(profile);
    return { success: true, user: profile };
  }

  // ── Session ───────────────────────────────────────────────────────────────

  private static persistSession(user: UserProfile): void {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
    const session: StoredSession = { ...user, expiresAt: expiresAt.toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  static getSession(): UserProfile | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as StoredSession;
      if (new Date(s.expiresAt) < new Date()) { this.logout(); return null; }
      return { userId: s.userId, username: s.username, displayName: s.displayName, avatarEmoji: s.avatarEmoji, createdAt: s.createdAt };
    } catch { return null; }
  }

  static refreshSession(updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>): void {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as StoredSession;
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, ...updates }));
    } catch { /* ignore */ }
  }

  static logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  // ── Delete account ────────────────────────────────────────────────────────

  static async deleteAccount(userId: string, username: string): Promise<void> {
    if (MongoDBService.isAvailable()) {
      await MongoDBService.deleteOne('users', { userId });
      await MongoDBService.deleteOne('progress', { userId });
    } else {
      const users = this.getLocalUsers().filter(u => u.userId !== userId);
      StorageUtils.set(LS_USERS_KEY, users);
      localStorage.removeItem(`mth_progress_${userId}`);
    }
    // Only clear the session when the account being deleted belongs to the
    // currently logged-in user. An admin deleting another user's account must
    // not be logged out as a side-effect.
    const session = this.getSession();
    if (session?.userId === userId) {
      this.logout();
    }
  }

  // ── Update profile ────────────────────────────────────────────────────────

  static async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>
  ): Promise<UserProfile | null> {
    if (MongoDBService.isAvailable()) {
      await MongoDBService.updateOne(
        'users',
        { userId },
        { $set: updates },
        false
      );
      const updated = await MongoDBService.findOne<MongoUser>('users', { userId });
      if (updated) {
        const profile = this.docToProfile(updated);
        this.refreshSession(updates);
        return profile;
      }
      return null;
    }

    // localStorage fallback
    const users = this.getLocalUsers();
    const idx = users.findIndex(u => u.userId === userId);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    StorageUtils.set(LS_USERS_KEY, users);
    this.refreshSession(updates);
    return this.docToProfile(users[idx]);
  }

  // ── Admin helpers ─────────────────────────────────────────────────────────

  static async getAllUsers(): Promise<UserProfile[]> {
    if (MongoDBService.isAvailable()) {
      const docs = await MongoDBService.find<MongoUser>('users', {}, { createdAt: -1 });
      return docs.map(this.docToProfile);
    }
    return this.getLocalUsers().map(this.docToProfile);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private static docToProfile(doc: MongoUser): UserProfile {
    return {
      userId: doc.userId,
      username: doc.username,
      displayName: doc.displayName,
      avatarEmoji: doc.avatarEmoji,
      createdAt: doc.createdAt,
    };
  }

  private static getLocalUsers(): MongoUser[] {
    return StorageUtils.get<MongoUser[]>(LS_USERS_KEY) ?? [];
  }
}
