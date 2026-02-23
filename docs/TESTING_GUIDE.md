# Testing Guide for Endless Loop Bug Fixes

## Server Access
The application is now running at: **http://localhost:8080**

Open this URL in **Chrome** or **Edge** browser (required for Web Speech API support).

---

## Test Scenarios

### ✅ Test 1: Normal Flow (No Errors)
**Purpose:** Verify the app works correctly when all answers are correct

**Steps:**
1. Click "Начать" (Start)
2. Allow microphone access if prompted
3. Answer all Label 1 questions correctly:
   - 2 + 1 = три (3)
   - 5 + 1 = шесть (6)
   - 7 + 1 = восемь (8)
   - 3 + 1 = четыре (4)
   - 9 + 1 = десять (10)
4. Answer all Label 2 questions correctly:
   - 2 + 2 = четыре (4)
   - 5 + 2 = семь (7)
   - 7 + 2 = девять (9)
   - 4 + 2 = шесть (6)
   - 9 + 2 = одиннадцать (11)

**Expected Result:**
- ✅ App announces statistics after Label 1: "5 questions, 0 errors"
- ✅ App moves to Label 2
- ✅ App announces statistics after Label 2: "5 questions, 0 errors"
- ✅ App says "Ты хорошо поработал!" (You did well!)
- ✅ Session ends without loops

---

### ✅ Test 2: Label 1 with Errors (Retry Logic)
**Purpose:** Verify Label 1 repeats when there are errors

**Steps:**
1. Click "Начать" (Start)
2. Answer some Label 1 questions **incorrectly** (say wrong numbers)
3. Complete all 5 Label 1 questions

**Expected Result:**
- ✅ App announces: "5 questions, X errors"
- ✅ App says: "Давайте повторим эти примеры" (Let's repeat these examples)
- ✅ App announces each incorrect question with the correct answer
- ✅ App **restarts Label 1 from the beginning**
- ✅ **NO endless loop** - it should ask questions normally, not loop infinitely

---

### ✅ Test 3: Label 2 with Errors (Retry Logic)
**Purpose:** Verify Label 2 repeats when there are errors

**Steps:**
1. Complete Label 1 with all correct answers
2. Answer some Label 2 questions **incorrectly**
3. Complete all 5 Label 2 questions

**Expected Result:**
- ✅ App announces: "5 questions, X errors"
- ✅ App says: "Давайте повторим эти примеры" (Let's repeat these examples)
- ✅ App announces each incorrect question with the correct answer
- ✅ App **restarts Label 2 from the beginning**
- ✅ **NO endless loop** - it should ask questions normally

---

### ✅ Test 4: Unrecognized Speech (Previous Bug)
**Purpose:** Verify the app doesn't loop infinitely when speech isn't recognized

**Steps:**
1. Click "Начать" (Start)
2. Wait for the first question
3. Say something that's **not a number** (e.g., "hello", "test", mumble)
4. Or say **nothing at all** and wait

**Expected Result:**
- ✅ App shows error: "Не удалось распознать число. Нажмите 'Пропустить' или произнесите ответ четко."
- ✅ App **STOPS and WAITS** - no automatic retry loop
- ✅ Status shows: "Готов к ответу" (Ready for answer)
- ✅ You can click "Повторить вопрос" to try again
- ✅ Or click "Пропустить" to skip the question
- ✅ **NO ENDLESS LOOP**

---

### ✅ Test 5: "Repeat Question" Button
**Purpose:** Verify the new manual repeat functionality

**Steps:**
1. Click "Начать" (Start)
2. Wait for a question
3. Click "Повторить вопрос" (Repeat Question) button

**Expected Result:**
- ✅ App stops listening
- ✅ App asks the **same question again**
- ✅ You can answer the question normally
- ✅ No errors or crashes

---

### ✅ Test 6: "Skip Question" Button
**Purpose:** Verify skip functionality works properly

**Steps:**
1. Click "Начать" (Start)
2. Wait for a question
3. Click "Пропустить" (Skip) button

**Expected Result:**
- ✅ Question is marked as incorrect
- ✅ Added to error list
- ✅ App moves to next question
- ✅ After completing the label, skipped questions cause label to repeat

---

### ✅ Test 7: Stop and Reset
**Purpose:** Verify session controls work correctly

**Steps:**
1. Start a session
2. Answer a few questions
3. Click "Остановить" (Stop)
4. Click "Начать" again
5. Click "Сброс" (Reset)

**Expected Result:**
- ✅ Stop button halts the session
- ✅ Session can be resumed from where it stopped
- ✅ Reset clears all progress
- ✅ No background processes continue running

---

### ✅ Test 8: Speech Recognition Errors (Network/No-Speech)
**Purpose:** Verify automatic retry loops are eliminated

**Steps:**
1. Disconnect internet (for network error simulation)
2. Or cover/mute microphone (for no-speech simulation)
3. Start session
4. Wait for question

**Expected Result:**
- ✅ App shows appropriate error message
- ✅ **NO automatic retry loop**
- ✅ App waits for user action (Repeat or Skip)
- ✅ User has full control

---

## Key Improvements Summary

### Before the Fix:
- ❌ Endless loops when speech not recognized
- ❌ Automatic retries causing infinite loops
- ❌ Labels didn't repeat on errors (not per README)
- ❌ No user control during issues

### After the Fix:
- ✅ No endless loops - app waits for user action
- ✅ Labels properly repeat when there are errors
- ✅ New "Repeat Question" button for manual control
- ✅ Better error handling and user feedback
- ✅ Implements README requirements correctly

---

## Browser Console

Open Developer Tools (F12) to monitor console logs:
- Look for messages like: "✅ Speech recognition STARTED"
- Look for: "✅ Final transcript: [your answer]"
- Check for any red error messages
- Verify no infinite console spam (sign of loops)

---

## Common Issues & Solutions

### Issue: Microphone not working
**Solution:** Check browser permissions, ensure HTTPS or localhost

### Issue: Russian voice not available
**Solution:** 
- Windows: Install Russian language pack
- Settings → Time & Language → Language → Add Russian
- May need to restart browser

### Issue: Recognition not accurate
**Solution:** 
- Speak clearly and at moderate pace
- Adjust speech rate in settings
- Use the "Repeat Question" button if needed

---

## Success Criteria

The bug is **FIXED** if:
1. ✅ No infinite loops occur in any scenario
2. ✅ Labels repeat correctly when there are errors
3. ✅ App waits for user action instead of auto-retrying
4. ✅ "Repeat Question" button works
5. ✅ Session completes successfully with correct answers
6. ✅ All error scenarios are handled gracefully

---

## Contact

If you encounter any issues during testing, note:
- Which test scenario failed
- What error message appeared (if any)
- Browser console messages
- Expected vs. actual behavior

