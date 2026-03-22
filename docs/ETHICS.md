# אתיקה, הסברתיות ופרטיות — Hebrew Voice Math Tutor

## תוכן עניינים

1. [Explainability — הסברתיות](#1-explainability--הסברתיות)
2. [Fairness — הוגנות](#2-fairness--הוגנות)
3. [פרטיות ורגולציה (GDPR)](#3-פרטיות-ורגולציה-gdpr)
4. [EU AI Act](#4-eu-ai-act)
5. [אבטחת מידע](#5-אבטחת-מידע)
6. [ילדים ו-Parental Consent](#6-ילדים-ו-parental-consent)
7. [סיכום ופעולות נדרשות](#7-סיכום-ופעולות-נדרשות)

---

## 1. Explainability — הסברתיות

### White-Box System: ללא Black-Box ML

המערכת **אינה** משתמשת במודל ML קלאסי (רשת נוירונים, גרדיאנט בוסטינג וכו').
האלגוריתם הוא **Rule-Based לחלוטין** — כל החלטה ניתנת להסבר מלא.

### הסבר ברמת המודל (Global Explanation)

```
"המערכת מוסיפה שאלה לרשימת החזרה אם ורק אם המשתמש ענה עליה שגוי.
 בסשן הבא, עד 60% מהשאלות נלקחות מרשימה זו.
 שאלה מוסרת מהרשימה כאשר נענית נכון בסשן חזרה."
```

אין משתנה נסתר. אין מקדמים. אין embedding.

### הסבר ברמת הפרדיקציה הבודדת (Local Explanation)

לכל משתמש ניתן להסביר:

| שאלה | תשובה |
|------|-------|
| למה הוצגה שאלה זו? | "כי ענית עליה שגוי ב-23/02/2026" |
| למה לא הוצגה שאלה זו? | "כי ענית עליה נכון 2 פעמים מאז הוספתה לרשימה" |
| מה משפיע על הסשן הבא? | weakQuestionIds, category, difficulty, questionCount |

### השוואה לגישות Explainability אחרות

| גישה | מתי? | מה מסביר? | רלוונטי לפרויקט? |
|------|------|-----------|------------------|
| SHAP | אחרי אימון ML | Feature importance | לא — אין ML |
| LIME | אחרי אימון ML | Local approximation | לא — אין ML |
| Rule Extraction | מ-Black Box | חוקים פשוטים | לא — כבר Rule-Based |
| **Inherent (שלנו)** | **תמיד** | **הלוגיקה עצמה** | **כן** |

---

## 2. Fairness — הוגנות

### Bias מובנה שזוהה

#### 1. Bias ברמת הקושי

```
easy:   62/95 = 65%
medium: 25/95 = 26%
hard:    8/95 =  9%
```

**השפעה:** ילדים מתקדמים (יודעים easy) יקבלו פחות שאלות מאתגרות.
**מיתון:** ניתן לפלטר לפי `difficulty` בממשק.

#### 2. Bias לשוני

המערכת מזהה תשובות בעברית בלבד (`parseNumber` מתמלל עברית).
ילדים ממשפחות דוברות ערבית/רוסית עלולים להיתקל בקושי זיהוי.

**מיתון מומלץ:** הוספת `parseNumber` בשפות נוספות.

#### 3. Bias טכנולוגי

Chrome בלבד תומך ב-Web Speech API ל-he-IL בצורה מלאה.
ילדים ממשפחות עם גישה מוגבלת לטכנולוגיה מושפעים יותר.

### מסגרות נורמטיביות

| מסגרת | מיקום הפרויקט |
|-------|--------------|
| EU AI Act (High Risk) | Education system → נדרש conformity assessment |
| UNESCO AI Ethics (2021) | Human oversight נוכח (הורה/מורה) |
| OECD AI Principles | Transparency ✓, Human-centered ✓, Robustness — חלקי |

### המלצות לשיפור Fairness

- [ ] אזן את מסד השאלות (35% easy / 40% medium / 25% hard)
- [ ] הוסף parseNumber לערבית ורוסית
- [ ] בדוק accuracy לפי שפת בית המשתמש
- [ ] תמך ב-Firefox ו-Safari (כשיתמכו ב-STT Hebrew)

---

## 3. פרטיות ורגולציה (GDPR)

### סיווג הנתונים

| נתון | קטגוריה GDPR | שמור היכן |
|------|-------------|----------|
| username | Personal Data | MongoDB Atlas / localStorage |
| displayName | Personal Data | MongoDB Atlas / localStorage |
| passwordHash + salt | Personal Data (pseudonymous) | MongoDB Atlas / localStorage |
| sessionHistory | Behavioral Data | MongoDB Atlas / localStorage |
| weakQuestionIds | Behavioral Data | MongoDB Atlas / localStorage |
| **audio מהמיקרופון** | **Sensitive — ביומטרי** | **לא נשמר בכלל** |

> **חשוב:** אודיו מהמיקרופון עובר **ישירות ל-Web Speech API של הדפדפן** ואינו נשמר לשום שרת. הוא לא עובר דרך הקוד שלנו.

### עקרונות GDPR — מצב יישום

| עיקרון | מצב | הערות |
|--------|-----|-------|
| Lawfulness | חלקי | נדרש Consent מפורש |
| Purpose Limitation | ✓ | נתונים משמשים רק ל-learning tracking |
| Data Minimisation | ✓ | רק מה שנדרש לפונקציה |
| Accuracy | ✓ | המשתמש יכול לעדכן displayName |
| Storage Limitation | חלקי | אין auto-deletion לאחר זמן |
| **Right to Erasure (Art. 17)** | **✓** | **`deleteAccount()` מוחק הכל** |
| Data Portability (Art. 20) | ✓ | AdminDashboard מאפשר Export JSON |
| Security | ✓ | PBKDF2, HTTPS לMongoDB |
| DPA Notification | ✗ | לא רלוונטי לשלב המחקר |

### Right to Erasure — מה נמחק

כשמשתמש לוחץ "מחק חשבון":

```
1. MongoDB: deleteOne({ userId }) מ-users collection
2. MongoDB: deleteOne({ userId }) מ-progress collection
3. localStorage: removeItem('mth_users')  → מחיקת רשומת המשתמש
4. localStorage: removeItem('mth_progress_<userId>')
5. localStorage: removeItem('mth_session') → logout
```

### Data Retention

**נוכחי:** נתונים נשמרים ללא הגבלת זמן.

**מומלץ:** הוספת שדה `lastActiveDate` ומחיקה אוטומטית לאחר 12 חודשי חוסר פעילות.

---

## 4. EU AI Act

### סיווג

| פרמטר | ערך |
|-------|-----|
| Domain | חינוך ילדים |
| Risk Level | **High Risk** (Annex III, §3) |
| System Type | AI system that evaluates persons |

### דרישות High Risk (מצב יישום)

| דרישה | מצב | מה חסר |
|-------|-----|--------|
| Technical Documentation | חלקי | README + EXPERIMENT.md קיימים |
| Transparency to users | ✓ | המערכת מסבירה את ההיגיון |
| Human Oversight | ✓ | הורה/מורה נוכח בשימוש |
| Accuracy & Robustness | חלקי | Error handling קיים, לא מקיף |
| Conformity Assessment | ✗ | לא בוצע (שלב מחקר) |
| CE Marking | ✗ | לא נדרש בשלב מחקר אקדמי |

---

## 5. אבטחת מידע

### אמצעים קיימים

| אמצעי | פירוט |
|-------|-------|
| PBKDF2 | 100,000 iterations, SHA-256, 256-bit, salt ייחודי לכל משתמש |
| HTTPS | כל תקשורת עם MongoDB Atlas דרך HTTPS |
| No plaintext passwords | הסיסמה המקורית לא נשמרת לעולם |
| Session expiry | token פג תוקף לאחר 30 יום |
| Admin auth | AdminDashboard מוגן בסיסמה נפרדת |

### חולשות ידועות

| חולשה | חומרה | הסבר |
|-------|-------|------|
| API Key client-side | גבוהה | `REACT_APP_MONGODB_API_KEY` נחשף ב-browser bundle |
| Admin password plain compare | בינונית | סיסמת admin נבדקת client-side בלבד |
| localStorage not encrypted | נמוכה | נתוני progress קריאים לכל script באתר |
| No CSRF protection | נמוכה | MongoDB Atlas API מוגן ב-API Key |

### המלצות לסביבת ייצור

```
⚠️  לסביבת ייצור מלא:
1. הוסף Backend API (Node.js/Express) כ-proxy בין client ל-MongoDB
2. אל תחשוף API Keys בקוד client-side
3. הוסף Rate Limiting לנקודות end-point של auth
4. שקול bcrypt בצד שרת במקום PBKDF2 בדפדפן
```

---

## 6. ילדים ו-Parental Consent

### GDPR Article 8 — עיבוד נתוני ילדים

| פרמטר | דרישה | מצב |
|-------|-------|-----|
| גיל הסכמה (EU) | 16 (או נמוך יותר לפי מדינה) | לא רלוונטי — ילד 5–8 |
| Parental Consent | **נדרש** לכל עיבוד | **לא מיושם** |
| Information clarity | שפה פשוטה להורה | אין מסמך Consent |

### COPPA (ארה"ב) — Children's Online Privacy Protection Act

אם המערכת תופץ בארה"ב לילדים מתחת לגיל 13 — נדרש:
- Verifiable Parental Consent לפני כל איסוף נתונים
- Privacy Notice גלוי
- מדיניות מחיקת נתונים

### פעולות נדרשות לפני פריסה ציבורית

- [ ] הוסף מסך Parental Consent לפני הרשמה
- [ ] כתוב Privacy Policy בשפה ברורה לאנשי מקצוע ולהורים
- [ ] הגבל גיל הרשמה (checkbox "אני הורה/מורה המאשר")
- [ ] שקול Anonymous Mode (ללא שמירת נתונים אישיים)

---

## 7. סיכום ופעולות נדרשות

### מה טוב בפרויקט מבחינה אתית

| נושא | הישג |
|------|------|
| Explainability | White-box מלא — אפס black-box |
| Right to Erasure | מיושם לחלוטין |
| Audio Privacy | אין שמירת אודיו |
| Password Security | PBKDF2 industry-grade |
| Transparency | Dragon Mascot מסביר כל תשובה |

### Gaps עיקריים

| Gap | עדיפות | פעולה |
|-----|--------|-------|
| Parental Consent | גבוהה | הוסף מסך consent לפני הרשמה |
| API Key client-side | גבוהה | הוסף backend proxy בייצור |
| Question bias (65% easy) | בינונית | אזן את מסד השאלות |
| Data Retention | בינונית | הוסף auto-delete לאחר 12 חודש |
| Multi-language support | נמוכה | הוסף parseNumber לערבית/רוסית |

---

*תיעוד זה מהווה חלק מהתיעוד האקדמי של פרויקט Hebrew Voice Math Tutor.*
*עודכן לאחרונה: פברואר 2026*
