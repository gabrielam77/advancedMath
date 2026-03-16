---
name: User Management S3 Integration
overview: Add a full User Management System to the Hebrew Math Tutor app — sign in/up, profile CRUD, and per-user statistics — all stored in AWS S3 directly from the browser, with a modern redesigned UI that preserves the kid-friendly aesthetic.
todos:
  - id: install_s3_sdk
    content: Install @aws-sdk/client-s3 and create .env template file with required AWS variables
    status: completed
  - id: add_user_types
    content: Add UserProfile, UserCredentials, AuthState interfaces to src/types/index.ts
    status: completed
  - id: create_s3_service
    content: Create S3Service.ts - AWS SDK v3 wrapper with getObject, putObject, deleteObject methods
    status: completed
  - id: create_auth_service
    content: Create AuthService.ts - password hashing (Web Crypto API), login/register flow reading/writing credentials to S3
    status: completed
  - id: create_user_service
    content: Create UserService.ts - profile CRUD (read/update/delete user profile and progress from S3)
    status: completed
  - id: create_auth_context
    content: Create AuthContext.tsx - global auth state provider with currentUser, login(), logout(), register()
    status: completed
  - id: build_login_page
    content: Build LoginPage.tsx - full-screen modern sign in/up with Dragon mascot, Hebrew validation, Framer Motion
    status: completed
  - id: build_user_ui
    content: Build UserAvatar.tsx, UserProfilePage.tsx, DeleteAccountModal.tsx
    status: completed
  - id: build_progress_dashboard
    content: Build UserProgressDashboard.tsx - per-user statistics fetched from S3, replacing StatisticsCard
    status: completed
  - id: wire_app
    content: Update App.tsx (add login/profile appState, UserAvatar in header), index.tsx (AuthProvider), ProgressService.ts (sync to S3)
    status: completed
isProject: false
---

# User Management System - AWS S3 Integration Plan

## Security Notice

Since there is no backend, AWS credentials will live in a `.env` file and be bundled into the browser app. You must create a **restricted IAM user** with write-only/read-own-prefix S3 permissions to minimize exposure.

## Architecture Overview

```mermaid
flowchart TD
    Browser["Browser App"]
    AuthCtx["AuthContext\n(global auth state)"]
    S3Svc["S3Service\n(AWS SDK v3)"]
    AuthSvc["AuthService\n(login/register/session)"]
    UserSvc["UserService\n(profile CRUD)"]

    Browser --> AuthCtx
    AuthCtx --> AuthSvc
    AuthSvc --> S3Svc
    UserSvc --> S3Svc

    S3Svc -->|"users/registry.json"| S3
    S3Svc -->|"users/{userId}/profile.json"| S3
    S3Svc -->|"users/{userId}/credentials.json"| S3
    S3Svc -->|"users/{userId}/progress.json"| S3
```



## S3 Bucket Structure

```
math-tutor-users/
└── users/
    ├── registry.json             ← username → userId map (for login lookup)
    └── {userId}/
        ├── profile.json          ← displayName, username, avatar emoji, createdAt
        ├── credentials.json      ← passwordHash (SHA-256 + salt), salt
        ├── progress.json         ← StudentProgress (mirrors current ProgressService data)
        └── statistics.json       ← per-session stats, category breakdowns
```

## New Files to Create

### Context

- `src/context/AuthContext.tsx` - global auth state: `currentUser`, `login()`, `logout()`, `register()`

### Services

- `src/services/S3Service.ts` - AWS SDK v3 wrapper: `getObject`, `putObject`, `deleteObject`
- `src/services/AuthService.ts` - hash password (Web Crypto API, no extra packages), compare hash, read/write credentials to S3, session via `localStorage`
- `src/services/UserService.ts` - read/update/delete user profile and progress from S3

### Components

- `src/components/LoginPage.tsx` - full-screen sign in / sign up with tab switch, Framer Motion, Dragon mascot
- `src/components/UserProfilePage.tsx` - view/edit profile (display name, avatar emoji picker), delete account
- `src/components/UserAvatar.tsx` - small user badge shown in the app header
- `src/components/UserProgressDashboard.tsx` - rich per-user stats dashboard (replaces current `StatisticsCard` with user-specific data)
- `src/components/DeleteAccountModal.tsx` - confirmation modal with dragon reaction

## Modified Files

### `[src/types/index.ts](russian-math-tutor/src/types/index.ts)`

Add new interfaces:

```ts
export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarEmoji: string;
  createdAt: string;
}
export interface UserCredentials {
  username: string;
  passwordHash: string;
  salt: string;
}
export interface AuthState {
  isLoggedIn: boolean;
  currentUser: UserProfile | null;
}
```

### `[src/App.tsx](russian-math-tutor/src/App.tsx)`

- Wrap app in `<AuthProvider>` (from `AuthContext`)
- Add `appState = 'login'` as initial state (show login before setup)
- Show `<UserAvatar>` in the header when logged in
- Add `appState = 'profile'` to render `<UserProfilePage>`

### `[src/services/ProgressService.ts](russian-math-tutor/src/services/ProgressService.ts)`

- After every `recordAnswer` / `completeSession`, sync progress to S3 via `UserService.saveProgress(userId, progress)`

### `[src/index.tsx](russian-math-tutor/src/index.tsx)`

- Wrap `<App>` with `<AuthProvider>`

## New Dependencies (1 package)

- `@aws-sdk/client-s3` — AWS SDK v3 S3 client (tree-shakeable, browser-compatible)

## Environment Variables (`.env`)

```
REACT_APP_AWS_REGION=us-east-1
REACT_APP_AWS_ACCESS_KEY_ID=...
REACT_APP_AWS_SECRET_ACCESS_KEY=...
REACT_APP_S3_BUCKET_NAME=math-tutor-users
```

## UI Design Approach

**Login Page:**

- Full-screen gradient (matching existing kids theme)
- Centered glassmorphism card
- Toggle tabs: "כניסה" (Sign In) / "הרשמה" (Sign Up)
- Dragon mascot on side with speech bubble guidance
- Animated field validation in Hebrew
- Framer Motion entrance/exit animations

**Header (when logged in):**

- Small avatar emoji + display name badge (top-left)
- Clicking opens dropdown: "פרופיל" / "התנתק"

**Profile Page:**

- Display name editable inline
- Emoji avatar picker (grid of fun emojis)
- Account info: joined date, total sessions played
- Red "מחיקת חשבון" button at bottom
- Dragon reacts to delete with "sad" mood

**User Progress Dashboard:**

- Replaces static `StatisticsCard` with personalized, per-user data fetched from S3
- Highlights: accuracy %, total questions, strongest/weakest category
- Recent 5 sessions list with color-coded scores
- All centered, no hover animations (consistent with existing fix)

## App State Flow

```mermaid
flowchart LR
    login["login\n(LoginPage)"] -->|"auth success"| setup["setup\n(existing)"]
    setup --> session["session\n(existing)"]
    session --> stats["stats\n(existing)"]
    stats --> setup
    setup -->|"avatar click"| profile["profile\n(UserProfilePage)"]
    profile --> setup
```



## Implementation Order

1. Install `@aws-sdk/client-s3`, create `.env` template
2. Add new types to `types/index.ts`
3. Create `S3Service.ts`
4. Create `AuthService.ts` (password hashing + S3 read/write)
5. Create `UserService.ts` (profile CRUD)
6. Create `AuthContext.tsx`
7. Build `LoginPage.tsx` with modern UI
8. Build `UserAvatar.tsx` + `UserProfilePage.tsx` + `DeleteAccountModal.tsx`
9. Build `UserProgressDashboard.tsx`
10. Wire everything into `App.tsx` and `index.tsx`
11. Update `ProgressService.ts` to sync to S3

