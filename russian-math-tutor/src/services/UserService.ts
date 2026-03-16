/**
 * UserService — profile and progress CRUD.
 * Uses MongoDB when configured, falls back to localStorage.
 */

import { UserProfile, StudentProgress } from '../types';
import { MongoDBService } from './MongoDBService';
import { AuthService } from './AuthService';
import { StorageUtils } from '../utils/storage';

const progressKey = (userId: string) => `mth_progress_${userId}`;

export class UserService {
  // ─── Profile ─────────────────────────────────────────────────────────────

  static async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'displayName' | 'avatarEmoji'>>
  ): Promise<UserProfile | null> {
    return AuthService.updateProfile(userId, updates);
  }

  // ─── Progress ─────────────────────────────────────────────────────────────

  static async getProgress(userId: string): Promise<StudentProgress | null> {
    if (MongoDBService.isAvailable()) {
      try {
        return await MongoDBService.findOne<StudentProgress>('progress', { userId });
      } catch (e) {
        console.warn('MongoDB getProgress failed, using localStorage:', e);
      }
    }
    return StorageUtils.get<StudentProgress>(progressKey(userId));
  }

  static async saveProgress(userId: string, progress: StudentProgress): Promise<void> {
    // Always save to localStorage immediately for offline support
    StorageUtils.set(progressKey(userId), progress);

    if (MongoDBService.isAvailable()) {
      try {
        await MongoDBService.updateOne(
          'progress',
          { userId },
          { $set: { ...progress, userId } },
          true   // upsert
        );
      } catch (e) {
        console.warn('MongoDB saveProgress failed, data safe in localStorage:', e);
      }
    }
  }

  static deleteLocalProgress(userId: string): void {
    localStorage.removeItem(`mth_progress_${userId}`);
  }

  // ─── Admin helpers ────────────────────────────────────────────────────────

  static async getAllProgress(): Promise<Array<StudentProgress & { userId: string }>> {
    if (MongoDBService.isAvailable()) {
      try {
        return await MongoDBService.find<StudentProgress & { userId: string }>(
          'progress',
          {},
          { userId: 1 }
        );
      } catch (e) {
        console.warn('MongoDB getAllProgress failed:', e);
      }
    }
    return [];
  }

  // ─── Account deletion ──────────────────────────────────────────────────────

  static async deleteAccount(userId: string, username: string): Promise<void> {
    await AuthService.deleteAccount(userId, username);
    this.deleteLocalProgress(userId);
  }
}
