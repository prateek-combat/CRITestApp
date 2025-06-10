# Resume Functionality & Email Restriction Features

## ✅ **Feature 1: Resume Functionality for Invitation Links**

### **What It Does:**

- Automatically saves test progress after each question
- Allows users to resume tests if internet connection drops
- Preserves all previous answers and test state
- Continues from the exact same question where they left off

### **How It Works:**

#### **Auto-Save Mechanism:**

- Progress saved when answering each question
- Progress saved when navigating between questions
- Tracks current question index in database
- Preserves all submitted answers

#### **Resume Detection:**

- When user clicks the same invitation link again
- System checks for existing IN_PROGRESS attempt
- Automatically restores test state if found
- Shows resume notification with progress summary

### **API Endpoints Added:**

```typescript
// Save/Get progress for invitation-based attempts
PUT / api / test - attempts / [id] / progress;
GET / api / test - attempts / [id] / progress;

// Save/Get progress for public attempts
PUT / api / public - test - attempts / [id] / progress;
GET / api / public - test - attempts / [id] / progress;

// Get existing attempt for invitation
GET / api / invitations / [id] / attempt;
```

### **Database Changes:**

```sql
-- Added to both TestAttempt and PublicTestAttempt models
currentQuestionIndex INT DEFAULT 0
```

### **User Experience:**

1. **During Test:** Progress automatically saved
2. **If Interrupted:** Simply click the same link again
3. **Resume Screen:** Shows progress summary and "Resume Test" button
4. **Seamless Continuation:** Starts exactly where they left off

---

## ✅ **Feature 2: Email Restriction for Public Links**

### **What It Does:**

- Prevents the same email from taking a public test multiple times
- Shows appropriate messages for different scenarios
- Allows resuming if the previous attempt was incomplete

### **How It Works:**

#### **Email Check Process:**

1. User enters email on public test page
2. System checks for existing attempts with that email
3. Different responses based on attempt status:
   - **No existing attempt:** Allow starting test
   - **IN_PROGRESS attempt:** Show resume option
   - **COMPLETED attempt:** Block with "already completed" message

### **API Endpoint Added:**

```typescript
// Check email restriction for public links
POST /api/public-test-links/[linkToken]/check-email
GET  /api/public-test-links/[linkToken]/check-email?email=user@email.com
```

### **Possible Responses:**

```json
// Can start test
{
  "hasExistingAttempt": false,
  "canStart": true,
  "testInfo": { "title": "General Test", "testId": "..." }
}

// Can resume test
{
  "hasExistingAttempt": true,
  "canResume": true,
  "attempt": { "id": "...", "status": "IN_PROGRESS", ... },
  "message": "You have an in-progress test. You can resume from where you left off."
}

// Already completed
{
  "hasExistingAttempt": true,
  "canResume": false,
  "attempt": { "id": "...", "status": "COMPLETED", ... },
  "message": "You have already completed this test."
}
```

### **User Experience:**

1. **First Time:** Enter email and name → Start test
2. **Return (Incomplete):** Enter same email → "Resume Test" option
3. **Return (Completed):** Enter same email → "Already completed" message

---

## 🎯 **Benefits:**

### **For Individual Invitations:**

- ✅ **Reliable**: Users can resume after internet issues
- ✅ **User-Friendly**: No lost progress, reduced frustration
- ✅ **Secure**: Each invitation is unique and tracked individually
- ✅ **Proctoring Continuity**: Video/audio recordings continue seamlessly

### **For Public Links:**

- ✅ **Fair**: Prevents multiple attempts by same person
- ✅ **Flexible**: Allows legitimate resumes for incomplete tests
- ✅ **Clear Communication**: Users know exactly what they can do
- ✅ **Data Integrity**: Prevents duplicate test records

---

## 🔧 **Implementation Status:**

### **Backend (Completed):**

- ✅ Database schema updated with `currentQuestionIndex`
- ✅ Progress save/load API endpoints
- ✅ Email restriction checking for public links
- ✅ Resume detection for invitation links

### **Frontend (Ready):**

- ✅ Auto-save on answer selection and navigation
- ✅ Resume detection and notification component
- ✅ Email checking for public links
- ✅ Seamless state restoration

### **Testing Requirements:**

- [ ] Test resume functionality with real internet interruptions
- [ ] Verify email restrictions work correctly
- [ ] Test proctoring continuity during resume
- [ ] Validate progress saving accuracy

---

## 📧 **Updated Email Template:**

The email template now includes:

- Information about resume capability
- Instructions to save the email for the link
- Reassurance about automatic progress saving
- Clear steps for resuming if interrupted

This provides users with confidence that technical issues won't result in lost progress, improving the overall test-taking experience.
