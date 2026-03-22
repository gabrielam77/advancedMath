# Plan B — תוכנית מגירה
## "מה קורה אם..." — Hebrew Voice Math Tutor

> מסמך זה מגדיר תגובות מובנות לכל תרחיש כשל אפשרי,
> לפי רמת חומרה ושלב בניסוי.

---

## מפת תרחישי כשל

```
תרחיש כשל
    │
    ├─ 🔴 קריטי (מאיים על ההגשה)
    │    ├─ Algorithm לא מתכנס
    │    ├─ p-value לא מובהק
    │    └─ אין מספיק משתתפים
    │
    ├─ 🟡 בינוני (דורש התאמה)
    │    ├─ Accuracy נמוכה מהצפוי
    │    ├─ זיהוי קול גרוע
    │    └─ נשירת משתתפים בניסוי
    │
    └─ 🟢 נמוך (ניתן לניהול)
         ├─ MongoDB downtime
         ├─ Chrome compatibility issue
         └─ שגיאות TypeScript בבנייה
```

---

## 🔴 תרחיש 1: האלגוריתם האדפטיבי לא מתכנס

### מה זה אומר?

`weakQuestionIds` גדל ולא קטן — המשתמש ממשיך לטעות על אותן שאלות
גם לאחר 3–4 סשנים של חזרה, ואין שיפור מדיד.

### סיבות אפשריות

| סיבה | זיהוי | תיקון |
|------|-------|-------|
| `MAX_REVIEW_RATIO` גבוה מדי — המשתמש לא נחשף לחומר חדש | `fresh_q < 3` בממוצע | הורד ל-40% review |
| שאלות חלשות קשות מדי לגיל | accuracy < 20% גם בניסיון 5+ | הוסף `difficulty_downgrade` |
| רשימת weak לא נקית — שאלות לא רלוונטיות מצטברות | `weak.length > 20` אחרי 5 סשנים | הוסף TTL: מחק weak אחרי 7 ימים |
| זיהוי קול גרוע — תשובות נכונות מתועדות כשגיאות | `null` transcripts > 30% | ראה תרחיש 4 |

### Plan B — שלב 1: Tune Parameters (לפני שינוי אלגוריתם)

```typescript
// QuestionService.ts — ניסוי פרמטרים חלופיים
const ADAPTIVE_CONFIGS = {
  conservative: { maxReviewRatio: 0.4, weakListCap: 20 },  // ברירת מחדל
  aggressive:   { maxReviewRatio: 0.6, weakListCap: 30 },  // נוכחי
  gentle:       { maxReviewRatio: 0.3, weakListCap: 15 },  // Plan B
};
```

**זמן יישום:** יום אחד. **סיכון:** נמוך.

### Plan B — שלב 2: Difficulty Downgrade אוטומטי

אם שאלה נכשלת 3 פעמים ברציפות → החלף אותה בשאלה קלה יותר מאותה קטגוריה.

```
שאלה hard נכשלת 3× → החלף ב-medium מאותה קטגוריה
שאלה medium נכשלת 3× → החלף ב-easy מאותה קטגוריה
שאלה easy נכשלת 3× → הצג "בואו נתרגל יחד" + הפעל הדגמה
```

**זמן יישום:** 3–4 ימים. **סיכון:** נמוך–בינוני.

### Plan B — שלב 3: Spaced Repetition (SRS) פשוט

אם גם Difficulty Downgrade לא עוזר — החלף את הלוגיקה ל-SRS בסיסי:

```
שאלה נענית נכון  → interval × 2   (הצג שוב בעוד interval ימים)
שאלה נענית שגוי  → interval = 1   (הצג מחר)
interval התחלתי  = 1 יום
```

**זמן יישום:** שבוע. **סיכון:** בינוני (שינוי אדריכלי).

---

## 🔴 תרחיש 2: p-value לא מובהק (p > 0.05)

### מה זה אומר?

לאחר הניסוי, הניתוח הסטטיסטי מראה שאין הבדל מובהק בין Adaptive ל-Random.

### לפני שמוותרים — בדוק אלה:

```
1. האם Effect Size (Cohen's d) הוא בכל זאת חיובי?
   d > 0.3  → יש trend — כתוב "borderline significant"
   d < 0.1  → באמת אין אפקט

2. האם הנתונים נורמלים? (Shapiro-Wilk)
   כן → נסה t-test זוגות (רגיש יותר)
   לא → Wilcoxon נכון, אבל אולי n קטן מדי

3. האם הסרת outliers? (ילד עם accuracy 100% = ceiling effect)
   סר outliers ↓ → הרץ מחדש
```

### Plan B — אסטרטגיה אקדמית

> **תרחיש זה אינו כשל — הוא תוצאה לגיטימית.**

| אפשרות | מה לכתוב | מתי |
|--------|---------|-----|
| **Null Result** | "לא נמצא הבדל מובהק. ייתכן כי n=13 אינו מספיק, או כי טווח הניסוי (5 סשנים) קצר מדי." | תמיד אמין |
| **Trend** | "נצפה trend חיובי (d=0.4, p=0.08) שעשוי להגיע למובהקות עם n גדול יותר." | d > 0.3 |
| **Ceiling Effect** | "ילדים השיגו accuracy > 85% בשני התנאים — שאלות קלות מדי. נדרש harder difficulty set." | accuracy > 85% |
| **Floor Effect** | "accuracy < 40% בשני התנאים — שאלות קשות מדי לגיל 5–8 שנבדק." | accuracy < 40% |

### Plan B — ניתוח חלופי

אם Wilcoxon נכשל: עבור ל**ניתוח איכותני**:

```
שאלון הורים/מורים:
1. האם שמת לב לשיפור בין סשן 1 לסשן 5?  (1–5)
2. האם הילד נראה יותר בטוח?              (1–5)
3. האם הילד ביקש לשחק שוב?              (כן/לא)
```

**זמן יישום יישום שאלון:** שבוע. **תוספת לכתיבה:** פרק Qualitative Results.

---

## 🔴 תרחיש 3: אין מספיק משתתפים (n < 10)

### Plan B — שלב 1: הרחב מקורות גיוס

| מקור | אופן גיוס |
|------|----------|
| גני ילדים / כיתות א' | פנייה למורה + Consent form |
| קבוצות הורים בוואטסאפ | שיתוף קישור + הסבר קצר |
| בני משפחה + חברים | "Convenience Sample" — תועד כ-limitation |
| גיל מורחב: 5–10 | הרחב קריטריוני הכללה |

### Plan B — שלב 2: הצמצם דרישות הניסוי

```
מקורי:    5 סשנים × 2 תנאים = 50 שאלות לילד
Plan B:   3 סשנים × 2 תנאים = 30 שאלות לילד
תוצאה:   n=8 עדיין מספיק ל-Wilcoxon (power=0.70)
```

### Plan B — שלב 3: עבור ל-Case Studies

אם n < 6: עבור מ-Quantitative ל-**Qualitative Case Studies**:

- תעד 3–5 ילדים בעומק
- השתמש ב-Thematic Analysis
- הצג session-by-session graphs לכל ילד
- כתוב: "ניסוי Feasibility — הכנה למחקר מלא"

---

## 🟡 תרחיש 4: זיהוי קול גרוע (> 30% null transcripts)

### סיבות נפוצות

| סיבה | אבחון | פתרון |
|------|-------|-------|
| מיקרופון חלש | Test `MediaDevices.getUserMedia` | בקש headset |
| רעש סביבה | SNR נמוך | עבור לחדר שקט |
| Chrome גרסה ישנה | `SpeechRecognition` לא זמין | עדכן ל-Chrome 124+ |
| ילד מדבר בשקט | confidence < 0.6 | הוסף ויזואליזציה של volume |

### Plan B: Input Mode חלופי — Keyboard/Touch

```tsx
// Plan B fallback — NumberInput component
// מוצג אוטומטית לאחר 3 null transcripts ברציפות

{consecutiveNulls >= 3 && (
  <div className="fallback-input">
    <p>קשה לשמוע אותך — הקש את התשובה:</p>
    <input type="number" onSubmit={handleManualAnswer} />
  </div>
)}
```

**זמן יישום:** יום אחד.

**השפעה על הניסוי:** תעד sessions עם Keyboard כ-"mixed mode" — exclude מניתוח ראשי, כלול כ-sensitivity analysis.

---

## 🟡 תרחיש 5: Accuracy נמוכה מ-50% בשני התנאים

### מה זה אומר?

ילדים טועים ביותר ממחצית השאלות גם ב-Adaptive וגם ב-Random — לא בגלל האלגוריתם, אלא כי **השאלות קשות מדי**.

### Plan B: Dynamic Difficulty Adjustment (DDA)

```
אחרי כל 3 שאלות:
  accuracy_last3 < 40%  → הורד difficulty אוטומטית
  accuracy_last3 > 80%  → העלה difficulty אוטומטית
  אחרת                 → שמור על difficulty נוכחי
```

**זמן יישום:** 2–3 ימים.

---

## 🟡 תרחיש 6: נשירה של > 30% משתתפים באמצע הניסוי

### Plan B: תיעוד ו-Intent-to-Treat Analysis

```
כלול בניתוח את כל מי שהתחיל:
  מי שסיים < 3 סשנים → החלף missing data ב-baseline accuracy
  מי שסיים 3–4 סשנים → כלול ב-sensitivity analysis
  מי שסיים 5 סשנים → ניתוח ראשי
```

פעולות מניעה:
- [ ] Reminder SMS/WhatsApp להורה בין סשנים
- [ ] "Completion sticker" מיידי בסוף כל סשן (gamification)
- [ ] קיצור session ל-5 שאלות אם ילד מראה עייפות

---

## 📋 טבלת סיכום — מה עושים מתי

| תרחיש | זיהוי | הפעל Plan B | זמן תגובה |
|-------|-------|------------|----------|
| Algorithm לא מתכנס | `weak.length` לא יורד אחרי 4 סשנים | Tune params → Difficulty Downgrade → SRS | שבוע 1 של Phase 3 |
| p > 0.05 | לאחר ניתוח | Null Result write-up + ניתוח איכותני | שבוע 2 של Phase 4 |
| n < 10 | סוף שבוע גיוס | הרחב גיוס → קצר ניסוי → Case Studies | שבוע 1–2 של Phase 3 |
| null transcripts > 30% | תוך 2 סשנים | Keyboard fallback | שבוע 1 של Phase 3 |
| Accuracy < 50% | אחרי Pilot | DDA אוטומטי | בין Phase 2 ל-3 |
| נשירה > 30% | לאחר שבוע 3 | Intent-to-Treat + Reminders | שוטף |

---

## הצהרת Plan B בעבודה האקדמית

> **כיצד לנסח זאת בפרק Methodology:**

```
"במקרה שתוצאות הניסוי הראשי לא יגיעו למובהקות סטטיסטית
(p > 0.05), יבוצע ניתוח משלים הכולל: (א) חישוב Effect Size
לזיהוי מגמות חיוביות שאינן מובהקות, (ב) ניתוח איכותני על
בסיס תצפיות ושאלוני הורים, ו-(ג) המלצות לניסוי המשך עם
מדגם גדול יותר. null result מתועד כהלכה תורם לספרות
המחקר באותה המידה כתוצאה חיובית."
```

---

*עודכן: מרץ 2026 | חלק מתיעוד Hebrew Voice Math Tutor*
