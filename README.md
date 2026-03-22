# מאמן מתמטיקה קולי לילדים — Hebrew Voice Math Tutor

> מערכת לימוד אדפטיבית לילדים בגיל 5–8, המשלבת זיהוי קולי בעברית,
> משוב מיידי ולמידה מותאמת אישית על בסיס שגיאות עבר.

**GitHub:** https://github.com/gabrielam77/advancedMath

---

## תוכן עניינים

1. [סקירת הפרויקט](#1-סקירת-הפרויקט)
2. [ארכיטקטורה](#2-ארכיטקטורה)
3. [התקנה מהירה](#3-התקנה-מהירה)
4. [הגדרת MongoDB Atlas](#4-הגדרת-mongodb-atlas)
5. [מבנה הקוד](#5-מבנה-הקוד)
6. [אלגוריתם הלמידה האדפטיבית](#6-אלגוריתם-הלמידה-האדפטיבית)
7. [ניהול משתמשים ואבטחה](#7-ניהול-משתמשים-ואבטחה)
8. [מסד נתוני השאלות](#8-מסד-נתוני-השאלות)
9. [פרוטוקול ניסוי](#9-פרוטוקול-ניסוי)
10. [אתיקה ופרטיות](#10-אתיקה-ופרטיות)
11. [ניהול גרסאות](#11-ניהול-גרסאות)
12. [רישיון](#12-רישיון)

---

## 1. סקירת הפרויקט

### מה זה?

אפליקציית web לילדים בגיל 5–8 הלומדים חשבון בסיסי בעברית.
האפליקציה מנהלת שיחה קולית מלאה — שואלת שאלות, מקשיבה לתשובה,
ומעדכנת באופן אוטומטי את הסשן הבא בהתאם לשגיאות עבר.

### תכונות עיקריות

| תכונה | תיאור |
|-------|-------|
| קול דו-כיווני | שאלות ב-TTS + זיהוי תשובה ב-STT, עברית מלאה |
| למידה אדפטיבית | עד 60% מהסשן הבא = חזרה על שאלות שנכשלו |
| דרקון מעודד | דמות SVG אנימטיבית עם משוב מותאם לתוצאה |
| ניהול משתמשים | הרשמה/כניסה עם MongoDB Atlas ו-localStorage fallback |
| אבטחת סיסמאות | PBKDF2 (100,000 iterations) דרך Web Crypto API |
| לוח סטטיסטיקות | דשבורד אישי עם accuracy, streak וקטגוריות |
| פאנל מנהל | AdminDashboard לניהול משתמשים ונתוני למידה |
| כפתור חזרת שאלה | חזרה על השאלה בלחיצה אחת בזמן ההאזנה |
| תמיכה ב-Dark Mode | מעבר בין ערכות אור/חושך |

### מחסנית טכנולוגית

| שכבה | טכנולוגיה | גרסה |
|------|-----------|------|
| Frontend | React + TypeScript | 19.2 / 4.9 |
| עיצוב | Tailwind CSS v4 | 4.x |
| אנימציות | Framer Motion | 11.x |
| קול | Web Speech API (he-IL) | Native Browser |
| מסד נתונים | MongoDB Atlas Data API | v1 |
| אחסון מקומי | localStorage | Native Browser |
| אבטחה | Web Crypto API (PBKDF2) | Native Browser |

---

## 2. ארכיטקטורה

### זרימת נתונים

```
👤 ילד
  │
  ▼ מדבר
🎤 Web Speech API (he-IL)
  │ raw audio → transcript
  ▼
📝 Preprocessing (parseNumber)
   Hebrew words → integer
  │
  ▼
⚖️  QuestionService.processAnswer()
   answer === correctAnswer ?
  │
  ├─ ✅ נכון → DragonMascot happy + speak praise
  └─ ❌ שגוי → DragonMascot encouraging + speak retry
  │
  ▼
💾 ProgressService (singleton)
   recordAnswer() → localStorage (sync)
                 → MongoDB Atlas (async background)
  │
  ▼
🔁 End of Session? → updateWeakQuestions()
   wrongIds → addWeakQuestions()
   reviewCorrectIds → removeWeakQuestions()
  │
  ▼
📐 Next Session: weakList.length > 0 ?
   yes → createAdaptiveSession() (≤60% review)
   no  → createSession() (100% fresh)
  │
  ▼
🔊 TTS speaks next question → back to top
```

### שכבות המערכת

```
┌─────────────────────────────────────────────────────────┐
│ UI LAYER                                                 │
│  LoginPage | App | VoiceController | UserProgressDashboard │
│  AdminDashboard | DragonMascot | CategorySelector        │
├─────────────────────────────────────────────────────────┤
│ SERVICE LAYER                                            │
│  AuthService | ProgressService | QuestionService        │
│  QuestionDatabaseService | UserService | MongoDBService  │
├─────────────────────────────────────────────────────────┤
│ STORAGE LAYER                                            │
│  localStorage (immediate) ← → MongoDB Atlas (background)│
│  questions.json (static question bank)                   │
└─────────────────────────────────────────────────────────┘
```

### עקרונות עיצוב

- **Zero backend server** — כל הלוגיקה רצה client-side בדפדפן
- **localStorage-first** — כל שמירה מיידית, MongoDB כ-sync layer
- **Rule-based adaptive** — explainable by design, ללא black-box ML
- **Zero external dependencies** לליבה — Web Platform APIs בלבד

---

## 3. התקנה מהירה

### דרישות מוקדמות

- **Node.js** >= 16.0
- **Chrome** (נדרש לתמיכה מלאה ב-Web Speech API)
- **מיקרופון** פעיל
- חיבור אינטרנט (לסינכרון MongoDB — אופציונלי)

### שלבי התקנה

```bash
# שכפול ה-repository
git clone https://github.com/gabrielam77/advancedMath.git
cd advanced-math-tutor/russian-math-tutor

# התקנת תלויות
npm install

# הגדרת משתני סביבה (אופציונלי — ראה סעיף 4)
cp .env.template .env
# ערוך .env עם פרטי MongoDB

# הפעלת שרת פיתוח
npm start
```

האפליקציה תיפתח אוטומטית בכתובת `http://localhost:3000`

### פקודות נוספות

```bash
npm test          # הרצת בדיקות
npm run build     # build לייצור
```

---

## 4. הגדרת MongoDB Atlas

MongoDB Atlas הוא **אופציונלי** — ללא הגדרה, האפליקציה עובדת
מקומית עם localStorage בלבד.

### שלבי הגדרה

1. צור חשבון חינמי בכתובת https://cloud.mongodb.com
2. צור Cluster חינמי (M0 Free Tier)
3. גש ל: **App Services → Create App → HTTPS Endpoints → Enable Data API**
4. ב-**Authentication → API Keys** — צור מפתח עם הרשאות read/write
5. ערוך את קובץ `.env`:

```env
REACT_APP_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1
REACT_APP_MONGODB_API_KEY=YOUR_API_KEY_HERE
REACT_APP_MONGODB_DATABASE=mathTutor
REACT_APP_MONGODB_DATA_SOURCE=Cluster0
REACT_APP_ADMIN_PASSWORD=choose_a_secure_admin_password
```

### Collections שנוצרות אוטומטית

| Collection | תוכן |
|------------|------|
| `users` | userId, username, displayName, avatarEmoji, passwordHash, salt, hashVersion |
| `progress` | userId, sessionHistory[], weakQuestionIds[], categoriesProgress, streak |

---

## 5. מבנה הקוד

```
russian-math-tutor/
├── src/
│   ├── components/
│   │   ├── VoiceController.tsx       ← ליבת האפליקציה: ניהול סשן קולי
│   │   ├── App.tsx                   ← ניהול מצב כללי ומסכים
│   │   ├── DragonMascot.tsx          ← SVG mascot + Framer Motion
│   │   ├── LoginPage.tsx             ← הרשמה/כניסה
│   │   ├── UserProgressDashboard.tsx ← דשבורד סטטיסטיקות
│   │   ├── AdminDashboard.tsx        ← פאנל ניהול משתמשים
│   │   ├── UserProfilePage.tsx       ← עריכת פרופיל
│   │   ├── UserAvatar.tsx            ← תפריט משתמש בהדר
│   │   ├── CategorySelector.tsx      ← בחירת קטגוריה
│   │   ├── DifficultySelector.tsx    ← בחירת רמת קושי
│   │   ├── QuestionDisplay.tsx       ← תצוגת שאלה נוכחית
│   │   ├── ProgressBar.tsx           ← סרגל התקדמות בסשן
│   │   ├── AnswerHistory.tsx         ← היסטוריית תשובות בסשן
│   │   ├── AdminPanel.tsx            ← ניהול מסד שאלות
│   │   └── DeleteAccountModal.tsx    ← אישור מחיקת חשבון
│   │
│   ├── services/
│   │   ├── AuthService.ts            ← הרשמה/כניסה, PBKDF2, session
│   │   ├── ProgressService.ts        ← מעקב התקדמות + weak questions
│   │   ├── QuestionService.ts        ← יצירת sessions (regular + adaptive)
│   │   ├── QuestionDatabaseService.ts← ניהול מסד השאלות
│   │   ├── UserService.ts            ← CRUD פרופיל + סנכרון MongoDB
│   │   └── MongoDBService.ts         ← wrapper ל-Atlas Data API
│   │
│   ├── context/
│   │   ├── AuthContext.tsx            ← global auth state (React Context)
│   │   └── ThemeContext.tsx           ← dark/light mode
│   │
│   ├── hooks/
│   │   └── useVoiceRecognition.ts    ← Web Speech API wrapper
│   │
│   ├── types/
│   │   └── index.ts                  ← כל ה-TypeScript interfaces
│   │
│   ├── utils/
│   │   └── storage.ts                ← localStorage utilities
│   │
│   └── data/
│       └── questions.json            ← מסד שאלות ברירת מחדל (v1.0.0)
│
├── .env.template                     ← תבנית משתני סביבה
├── package.json
└── tsconfig.json
```

---

## 6. אלגוריתם הלמידה האדפטיבית

### עיקרון: Mastery Learning (Bloom, 1968)

> "שאלות שהתלמיד לא שלט בהן חוזרות בסשן הבא עד להשגת שליטה מלאה."

### זרימת האלגוריתם

```
סיום סשן
    │
    ├─ שאלות שגויות → addWeakQuestions(wrongIds)
    │   • deduplication
    │   • cap ב-30 שאלות
    │
    ├─ שאלות review שנענו נכון → removeWeakQuestions(reviewCorrectIds)
    │
    ▼
בחירת סשן הבא:
    │
    weakList.length > 0?
    │
    ├─ כן → createAdaptiveSession()
    │         ├─ weakTemplates = resolve IDs from DB
    │         ├─ filter by category/difficulty
    │         ├─ shuffle + take ≤60% as review
    │         ├─ fill rest with fresh random questions
    │         └─ shuffle all together (review not obvious)
    │
    └─ לא → createSession()
              └─ 100% fresh random questions
```

### פרמטרים

| פרמטר | ערך | תיאור |
|-------|-----|-------|
| `MAX_REVIEW_RATIO` | 60% | מקסימום שאלות חזרה בסשן |
| `WEAK_LIST_CAP` | 30 | מקסימום שאלות ברשימת החולשה |
| `SESSION_DAYS` | 30 | תוקף session token |

### השוואת חלופות (Baselines)

| אסטרטגיה | מביאה בחשבון שגיאות | חזרה מתוכננת | Retention |
|-----------|---------------------|--------------|-----------|
| Random Session | ✗ | מקרית | חלש |
| Category Filter | ✗ | ✗ | חלש |
| Blocked Repetition | ✓ | 100% immediate | בינוני |
| **Adaptive (מרכזי)** | **✓** | **≤60% deferred** | **חזק** |

---

## 7. ניהול משתמשים ואבטחה

### הצפנת סיסמאות: PBKDF2

```
סיסמת המשתמש עוברת:
  salt (16 bytes, crypto.getRandomValues)
       +
  PBKDF2-SHA-256 (100,000 iterations)
       +
  256-bit output
       ↓
  passwordHash (hex string) — נשמר ב-DB
```

- זמן hash: ~200ms בדפדפן (מכוון להיות איטי לאבטחה)
- הסיסמה המקורית **לעולם לא נשמרת**
- migration שקוף: hashVersion 1 (SHA-256 legacy) → hashVersion 2 (PBKDF2)

### session management

- session token נשמר ב-localStorage
- תוקף: 30 יום
- logout: `localStorage.removeItem('mth_session')`
- admin delete: מוחק session רק של המשתמש שנמחק, לא של האדמין

### גישת AdminDashboard

מוגנת בסיסמה דרך `REACT_APP_ADMIN_PASSWORD` ב-.env.
**לא משתמש** בהרשאות MongoDB — סיסמה shared בלבד.

---

## 8. מסד נתוני השאלות

### `src/data/questions.json`

```json
{
  "version": "1.0.0",
  "questions": [
    {
      "id": "add-easy-001",
      "category": "addition",
      "difficulty": "easy",
      "expression": "1 + 1",
      "correctAnswer": 2,
      "tags": ["basic"]
    }
  ]
}
```

### התפלגות נוכחית (95 שאלות)

| קטגוריה | כמות | אחוז |
|---------|------|------|
| חיבור (addition) | 27 | 28% |
| חיסור (subtraction) | 22 | 23% |
| כפל (multiplication) | 19 | 20% |
| חילוק (division) | 17 | 18% |
| מעורב (mixed) | 10 | 11% |

| קושי | כמות | אחוז |
|------|------|------|
| easy | 62 | 65% |
| medium | 25 | 26% |
| hard | 8 | 9% |

### ניהול שאלות דרך AdminPanel

ניתן להוסיף/לערוך/למחוק שאלות דרך ⚙️ ניהול בממשק האפליקציה.
ניתן גם לייצא/לייבא כ-JSON.

---

## 9. פרוטוקול ניסוי

ראה קובץ מלא: [docs/EXPERIMENT.md](docs/EXPERIMENT.md)

### סיכום

- **H₀:** אין הבדל ב-accuracy על שאלות חלשות בין Adaptive ל-Random
- **H₁:** Adaptive מייצר accuracy גבוה יותר על שאלות חלשות
- **מבחן סטטיסטי:** Wilcoxon Signed-Rank (non-parametric, n<30)
- **Effect Size:** Cohen's d
- **מדגם מינימלי:** 13–15 ילדים (Within-Subject design)

---

## 10. אתיקה ופרטיות

ראה קובץ מלא: [docs/ETHICS.md](docs/ETHICS.md)

### נקודות עיקריות

- **GDPR:** Right to Erasure מיושם (`deleteAccount()`), אין שמירת audio
- **EU AI Act:** High Risk category (education) — partially compliant
- **ילדים:** נדרש Parental Consent לפי GDPR Article 8 (לא מיושם עדיין)
- **Explainability:** White-box rule-based — כל החלטה ניתנת להסבר מלא
- **Fairness:** Bias ידוע — easy questions over-represented (65%)

---

## 11. ניהול גרסאות

### Git Commit History

```
e830e0e  feat: add repeat-question button during active listening
5996748  security: upgrade password hashing from SHA-256 to PBKDF2
20f385c  feat: adaptive learning - next session reinforces wrong questions
7f5b63b  fix: admin delete no longer logs out the acting admin
fa5e359  feat: add MongoDB user management system + fix 4 bugs
```

### Commit Convention

```
feat:     פיצ'ר חדש
fix:      תיקון באג
security: שיפור אבטחה
docs:     תיעוד
refactor: ארגון מחדש
```

### מה ב-Git ומה לא

```
✅ נכלל:  src/, questions.json, .env.template, docs/
❌ מוחרג: .env (secrets), node_modules/, build/
```

---

## 12. רישיון

MIT License © 2026

---

## צוות

פרויקט אקדמי — פיתוח עם Cursor AI Assistant.
