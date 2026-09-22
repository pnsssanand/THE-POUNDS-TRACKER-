# The Pound Tracker

# THE POUNDSTRACKER

## COMPLETE ATOMIC-LEVEL DEVELOPMENT PROMPT

Build a complete, production-ready web application called:

# THE POUNDSTRACKER

A UK-focused personal finance and part-time work tracking platform where users can track:

* Part-time working hours
* Earnings
* Monthly earning targets
* Monthly working-hour targets
* Expenses
* Payment methods
* Preferred banks
* Upcoming payments
* Incoming payments
* Daily financial position
* Monthly financial position
* Savings
* Personal profile
* Motivational progress
* Financial reports

The application must use real Firebase persistence and real Cloudinary image uploads.

Do NOT build a fake/mock prototype.

Every important action must actually work.

---

# 1. TECHNOLOGY STACK

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* Firebase
* Firebase Authentication
* Cloud Firestore
* Cloudinary
* Recharts or another lightweight charting library
* React Router
* Lucide React icons or equivalent
* Responsive CSS
* Modern reusable component architecture

Use TypeScript strict mode.

Do not use unnecessary libraries.

---

# 2. FIREBASE CONFIGURATION

Use the following Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "@secret:GOOGLE_API_KEY ",
  authDomain: "the-pounds-tracker.firebaseapp.com",
  projectId: "the-pounds-tracker",
  storageBucket: "the-pounds-tracker.firebasestorage.app",
  messagingSenderId: "711016617322",
  appId: "1:711016617322:web:7372d8c407604fbbcf4113",
  measurementId: "@secret:GOOGLE_ANALYTICS_MEASUREMENT_ID "
};
```

IMPORTANT:

Do not hardcode this configuration throughout the application.

Create a centralized Firebase configuration file.

Prefer environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Create:

`.env.example`

with the required variable names.

---

# 3. FIREBASE SERVICES

Use Firebase for:

### Authentication

Firebase Authentication.

### Database

Cloud Firestore.

Do NOT use:

* Local-only database
* Fake JSON database
* localStorage as the primary database
* hardcoded user records

All important user data must persist in Firestore.

---

# 4. CLOUDINARY

Use Cloudinary for profile pictures.

Cloudinary:

```text
Cloud Name:
dlvjvskje

Upload Preset:
THE POUNDS TRACKER
```

Create environment variables:

```text
VITE_CLOUDINARY_CLOUD_NAME=dlvjvskje
VITE_CLOUDINARY_UPLOAD_PRESET=THE POUNDS TRACKER
```

Use Cloudinary's unsigned upload flow using the provided upload preset.

Do NOT put any Cloudinary API secret in frontend code.

When an image is uploaded:

1. Select image.
2. Validate file.
3. Upload to Cloudinary.
4. Receive secure URL.
5. Store only the resulting URL and relevant public identifier in Firestore.
6. Display the image immediately.

---

# 5. BRAND

Application name:

# THE POUNDSTRACKER

Always use this exact branding.

Create a reusable logo/brand component.

Brand identity should communicate:

* UK
* Money
* Earnings
* Progress
* Personal finance
* Simplicity

Use the £ symbol as a subtle visual element.

---

# 6. DESIGN DIRECTION

The design must look like a premium UK fintech application.

Think:

* Modern
* Clean
* Minimal
* Professional
* Premium
* Trustworthy
* Spacious
* Easy to understand

Avoid:

* Cheap-looking gradients
* Excessive animations
* Clutter
* Huge unnecessary text
* Cartoon-style UI
* Excessive colours
* Generic template appearance

Use:

* Clean cards
* Rounded corners
* Subtle borders
* Soft shadows
* Excellent typography
* Strong visual hierarchy
* Clear financial numbers
* Professional icons
* Smooth transitions

The application should feel like a real product.

---

# 7. SPLASH SCREEN

Every time the application initially loads, display a short branded animation.

Show:

£

then:

THE POUNDSTRACKER

Animation:

1. £ symbol fades/scales in.
2. Logo/name appears.
3. Subtle loading animation.
4. Transition to authentication/dashboard.

Duration:

Approximately 1–2 seconds.

Do not make the splash screen annoying.

---

# 8. AUTHENTICATION

Use Firebase Authentication.

Support:

## SIGN UP

Fields:

* Full name
* Username
* Email
* Password
* Confirm password

Validation:

* Name required
* Username required
* Username unique
* Valid email
* Password required
* Password strength
* Confirm password must match

On signup:

1. Create Firebase Authentication user.
2. Create Firestore user profile.
3. Default role = `user`.
4. Create default settings.
5. Redirect to dashboard.

---

# 9. LOGIN

Login fields:

* Email / Username
* Password

Because Firebase Authentication uses email/password, implement username login through a Firestore username lookup if username login is required.

Recommended structure:

```text
usernames/{username}
```

Fields:

```text
uid
email
```

Login flow:

Username:

Anand

↓

Find:

usernames/anand

↓

Resolve email

↓

Firebase signInWithEmailAndPassword()

Do not store passwords in Firestore.

---

# 10. USER EXAMPLE

Use this example throughout development:

User:

**Anand**

Anand is a normal user.

He should be able to:

* Login
* Add work
* Track earnings
* Set targets
* Track expenses
* Add payments
* Track savings
* Upload profile photo
* See reports
* Receive motivation

---

# 11. ADMIN SYSTEM

Create a separate Admin Dashboard.

Only users with:

```text
role: "admin"
```

can access it.

Admin route:

```text
/admin
```

Protect the route.

Also enforce admin authorization in Firebase Security Rules.

Do NOT rely only on frontend route protection.

---

# 12. ADMIN DASHBOARD

Admin homepage should show:

### Total Users

### Active Users

### New Users

### Total Registered Users

### Recent Users

### User Search

Display users:

* Profile picture
* Full name
* Username
* Email
* Role
* Created date
* Last login if available
* Account status

Admin can search:

* Name
* Username
* Email

---

# 13. ADMIN USER CREATION

Admin should have:

**Create User**

Form:

* Full name
* Username
* Email
* Temporary password
* Role

Roles:

* User
* Admin

When creating a user:

* Create Firebase Authentication account.
* Create Firestore profile.
* Create username mapping.

Never display passwords after creation.

---

# 14. ADMIN USER VIEW

Admin can open a user profile.

Example:

Anand

Show account information and, according to the defined admin permissions:

* Account information
* Work summary
* Earnings summary
* Expense summary
* Monthly balance
* Account creation date

Never expose:

* Password
* Savings PIN
* Authentication secrets

---

# 15. DATABASE STRUCTURE

Use:

```text
users/{uid}
```

User document:

```text
uid
username
email
displayName
photoURL
phoneNumber
role
createdAt
updatedAt
lastLoginAt
```

Then subcollections:

```text
users/{uid}/workSessions/{workSessionId}

users/{uid}/expenses/{expenseId}

users/{uid}/upcomingPayments/{paymentId}

users/{uid}/incomingPayments/{paymentId}

users/{uid}/savings/{savingId}
```

Settings:

```text
users/{uid}/settings/profile
```

---

# 16. PROFILE SETTINGS

Store:

```text
monthlyHoursTarget
monthlyEarningsTarget
preferredPaymentMode
preferredBank
savingsPinHash
last80PercentNotificationMonth
```

Do not store the savings PIN in plaintext.

---

# 17. MAIN APPLICATION NAVIGATION

Desktop sidebar:

* Dashboard
* Work & Earnings
* Expenses
* Upcoming Payments
* Incoming Payments
* Reports
* Savings
* Profile
* Settings
* Logout

Mobile:

Use a compact bottom navigation plus "More" menu.

---

# 18. DASHBOARD

After Anand logs in:

Show:

**Good evening, Anand**

depending on current time:

Good morning

Good afternoon

Good evening

Then display the main financial overview.

---

# 19. DASHBOARD SUMMARY CARDS

Display:

### Today's Earnings

Example:

£65.00

### Monthly Earnings

£1,250.00

### Monthly Expenses

£720.00

### Monthly Balance

+£530.00

### Working Hours

58.5 hrs

### Savings

£2,000

---

# 20. CURRENT MONTH STATUS

Create a highly visible card:

## YOUR MONTH

Show:

Income:

£1,250

Expenses:

£720

Net:

+£530

Status:

**You're positive this month.**

If expenses are greater:

**You're negative this month.**

If equal:

**You're balanced this month.**

---

# 21. WORK & EARNINGS

Create:

# WORK & EARNINGS

User can add a part-time work session.

Form:

### Company Name

Example:

ABC Cafe

### Work Date

### Check-in

Example:

17:00

### Check-out

Example:

22:00

### Hourly Pay

Example:

£12.50

### Break

Example:

30 minutes

### Notes

Optional.

---

# 22. AUTOMATIC WORK CALCULATION

Calculate:

```text
workedMinutes =
checkout - checkin - breakMinutes
```

Then:

```text
workedHours = workedMinutes / 60
```

Then:

```text
earnings = workedHours × hourlyRate
```

Example:

17:00 → 22:00

5 hours

30-minute break

4.5 hours

£12.50/hour

4.5 × £12.50

= £56.25

Show a live preview before saving:

```text
WORKED
4h 30m

EARNED
£56.25
```

---

# 23. OVERNIGHT SHIFTS

Support:

22:00 → 02:00

Calculate correctly:

4 hours.

Do not return negative hours.

---

# 24. WORK SESSION STORAGE

Save:

```text
companyName
workDate
checkIn
checkOut
breakMinutes
hourlyRate
workedMinutes
workedHours
earnings
notes
createdAt
updatedAt
```

---

# 25. WORK HISTORY

Show:

* Date
* Company
* Time
* Hours
* Rate
* Earnings

Allow:

* Edit
* Delete
* Duplicate

Newest first.

---

# 26. EARNINGS TOTALS

Automatically calculate:

### Today

### This Week

### This Month

### This Year

### Overall

All values must come from Firestore.

---

# 27. MONTHLY WORK TARGET

Ask user:

**How many hours do you want to work this month?**

Example:

80 hours

Store:

```text
monthlyHoursTarget: 80
```

---

# 28. MONTHLY MONEY TARGET

Ask:

**How much do you want to earn this month?**

Example:

£1,000

Store:

```text
monthlyEarningsTarget: 1000
```

---

# 29. TARGET DASHBOARD

Show two progress cards.

### WORK TARGET

59 / 80 hours

73.75%

Progress bar.

### EARNINGS TARGET

£780 / £1,000

78%

Progress bar.

---

# 30. 80% MOTIVATION SYSTEM

This is important.

When monthly work hours reach:

80%

show a popup.

Example:

# YOU'RE OVER 80%!

You've worked:

64 / 80 hours

Only:

16 hours

to reach your target.

Then show:

**"You've built serious momentum. Keep going!"**

Buttons:

Continue Working

Close

---

# 31. POPUP FREQUENCY

Do NOT show the popup every time the user opens the dashboard.

Store:

```text
last80PercentNotificationMonth
```

Example:

```text
2026-09
```

Once the user has received the September milestone popup:

Do not show it again during September.

In October:

The system resets automatically.

---

# 32. MOTIVATION BEFORE 80%

Before reaching 80%, display a smart motivation card.

Example:

If:

20%

show:

"You're just getting started. Every shift moves you closer."

If:

50%

show:

"You're halfway there. Keep the momentum going."

If:

70%

show:

"You're getting close. Stay consistent."

If:

79%

show:

"Just a little more. You're almost at the 80% milestone."

---

# 33. MOTIVATION AT 100%

When target reaches 100%:

Show:

# TARGET ACHIEVED

Example:

80 / 80 hours

Then:

"Your monthly working-hours target is complete."

If above 100%:

Show:

# TARGET EXCEEDED

Example:

92 / 80 hours

12 hours above target.

---

# 34. SMART MOTIVATION ENGINE

Create a reusable function:

```text
generateMotivation()
```

Inputs:

* Current hours
* Target hours
* Current earnings
* Earnings target
* Days remaining
* Percentage complete

Return contextual text.

Examples:

Far below target:

"You still have time this month. Plan a few focused shifts and keep moving."

Near target:

"You're close to your target. A few more hours could get you there."

Target achieved:

"You reached your target. Great consistency."

Above target:

"You've exceeded your target by 12 hours."

---

# 35. EXPENSE TRACKER

Create:

# EXPENSES

Add expense.

Fields:

### Purpose

Example:

Groceries

### Amount

£35

### Date

### Category

### Payment Mode

Cash / Card

### Bank

Only show when Card is selected.

### Notes

Optional.

---

# 36. EXPENSE CATEGORIES

Use:

* Food
* Groceries
* Transport
* Rent
* Bills
* Shopping
* Entertainment
* Education
* Travel
* Family
* Health
* Subscriptions
* Other

---

# 37. PAYMENT METHOD

Options:

## CASH

No bank selection.

## CARD

Show:

Bank/payment account.

Example:

HSBC

---

# 38. BANK MANAGEMENT

User should be able to add banks.

Example:

* HSBC
* Barclays
* Lloyds
* NatWest
* Monzo
* Revolut
* Other

Allow custom bank name.

---

# 39. PREFERRED PAYMENT METHOD

Option:

**Always use this payment method**

Example:

Card

HSBC

Save.

Next time Anand adds an expense:

Payment mode automatically defaults to:

Card

Bank:

HSBC

---

# 40. CHANGE PREFERRED BANK

Suppose default:

HSBC

User selects:

Barclays

Then:

"Set as preferred"

After saving:

Future expenses default to:

Card → Barclays

---

# 41. EXPENSE HISTORY

Display:

Purpose

Amount

Date

Category

Payment mode

Bank

Allow:

* Edit
* Delete
* Search
* Filter
* Sort

---

# 42. EXPENSE TOTALS

Show:

Today's expenses

This week's expenses

This month's expenses

Total expenses

---

# 43. UPCOMING PAYMENTS

Create:

# UPCOMING PAYMENTS

Ask:

**Do you have any upcoming payments?**

Add:

* Payment name
* Amount
* Due date
* Category
* Notes

Example:

Rent

£600

30/09/2026

Status:

Pending

---

# 44. UPCOMING PAYMENT STATUS

Statuses:

* Pending
* Paid

When user marks:

Paid

then it becomes an actual expense only if the user confirms/records it as paid.

Avoid double counting.

---

# 45. INCOMING PAYMENTS

Create:

# INCOMING PAYMENTS

Ask:

**Are you expecting money from someone?**

Fields:

* Payer name
* Amount
* Expected date
* Notes

Example:

Part-time salary

£500

30/09/2026

Status:

Expected

---

# 46. INCOMING PAYMENT STATUS

Statuses:

* Expected
* Received

When marked:

Received

it can be included in actual incoming financial data according to the product's transaction logic.

Avoid double counting work-session income.

---

# 47. PROJECTED BALANCE

Create a separate card:

# PROJECTED BALANCE

Formula:

```text
Actual Balance
+ Expected Incoming Payments
- Upcoming Payments
```

Clearly label:

**Projected**

Do not confuse this with actual balance.

---

# 48. DAILY REPORT

Create:

# DAILY REPORT

Every day show:

Date

Income

Expenses

Net

Example:

21/09/2026

Income:

£75

Expenses:

£20

Net:

+£55

When user adds work:

Daily income updates automatically.

When user adds expense:

Daily expenses update automatically.

---

# 49. MONTHLY REPORT

Create:

# MONTHLY REPORT

Show:

* Income
* Expenses
* Net balance
* Working hours
* Work sessions
* Average daily income
* Average daily expenses
* Highest earning day
* Highest spending day

---

# 50. CHARTS

Use clean charts.

### Income vs Expenses

Bar chart.

### Income Trend

Line chart.

### Expense Categories

Donut chart.

### Working Hours

Bar chart.

Charts must be responsive.

---

# 51. REPORT FILTERS

Allow:

* Today
* This week
* This month
* Last month
* Custom range

Changing the range must update all report calculations.

---

# 52. SAVINGS VAULT

Savings is a private section.

Call it:

# SAVINGS VAULT

First access:

Ask user to create a PIN.

Example:

Create PIN:

● ● ● ●

Confirm PIN:

● ● ● ●

Do NOT store raw PIN.

---

# 53. SAVINGS PIN SECURITY

Never store:

```text
pin: "1234"
```

Instead securely hash the PIN or use a secure mechanism suitable for the implementation.

Store only the secure representation.

Implement reasonable failed-attempt protection.

---

# 54. SAVINGS ACCESS

Every time the user opens Savings:

Show:

# SAVINGS VAULT LOCKED

Enter PIN.

If correct:

Unlock.

If incorrect:

"Incorrect PIN."

Do not reveal anything about the correct PIN.

---

# 55. SAVINGS RECORD

Inside Savings:

Add saving.

Fields:

### Savings Name

Example:

Home

### Bank / Cash

Example:

HSBC

or:

Cash

### Amount

Example:

£1,500

---

# 56. SAVINGS LIST

Example:

HOME

HSBC

£1,500

EMERGENCY

Cash

£200

Show:

# TOTAL SAVINGS

£1,700

---

# 57. PROFILE

Create:

# PROFILE

Fields:

* Profile picture
* Full name
* Username
* Email
* Phone number
* Monthly work target
* Monthly earning target

Profile image upload:

Cloudinary.

---

# 58. PROFILE IMAGE UPLOAD

Flow:

Select image

↓

Validate

↓

Upload to Cloudinary

↓

Get secure URL

↓

Save URL in Firestore

↓

Update profile

Use:

Cloud name:

```text
dlvjvskje
```

Upload preset:

```text
THE POUNDS TRACKER
```

---

# 59. SECURITY / DATA ISOLATION

This is critical.

Anand must only access:

```text
users/{AnandUID}/...
```

Another user must never access Anand's:

* Earnings
* Work sessions
* Expenses
* Payments
* Savings
* Preferences

Use Firebase Authentication UID.

---

# 60. FIRESTORE SECURITY RULES

Implement rules so:

Authenticated user:

Can access own documents/subcollections.

Cannot access another user's data.

Cannot change:

```text
role
```

from user to admin.

Admin:

Can access permitted admin functionality.

Unauthenticated:

No financial access.

Test the rules.

---

# 61. ROUTES

Use:

```text
/
 /login
 /signup
 /dashboard
 /work
 /expenses
 /upcoming-payments
 /incoming-payments
 /reports
 /savings
 /profile
 /settings
 /admin
 /admin/users
 /admin/users/:uid
```

---

# 62. PROTECTED ROUTES

Unauthenticated user:

Redirect to `/login`.

Authenticated user:

Can access application.

Normal user:

Cannot access `/admin`.

Admin:

Can access `/admin`.

---

# 63. FIREBASE SERVICE ARCHITECTURE

Do not put Firestore calls everywhere.

Create:

```text
services/
  authService.ts
  userService.ts
  workService.ts
  expenseService.ts
  paymentService.ts
  savingsService.ts
  adminService.ts
```

Examples:

```text
addWorkSession()
getWorkSessions()
updateWorkSession()
deleteWorkSession()

addExpense()
getExpenses()
updateExpense()
deleteExpense()

addUpcomingPayment()
updateUpcomingPayment()

addIncomingPayment()
updateIncomingPayment()

addSaving()
getSavings()
deleteSaving()
```

---

# 64. TYPESCRIPT TYPES

Create:

```text
UserProfile
WorkSession
Expense
UpcomingPayment
IncomingPayment
Saving
UserSettings
PaymentPreference
MonthlyTarget
DashboardSummary
DailyReport
MonthlyReport
```

Avoid unnecessary `any`.

---

# 65. FIRESTORE DATA

## USER

```text
users/{uid}
```

Fields:

```text
uid
username
email
displayName
photoURL
phoneNumber
role
createdAt
updatedAt
lastLoginAt
```

---

## WORK

```text
users/{uid}/workSessions/{id}
```

Fields:

```text
companyName
workDate
checkIn
checkOut
breakMinutes
hourlyRate
workedMinutes
workedHours
earnings
notes
createdAt
updatedAt
```

---

## EXPENSE

```text
users/{uid}/expenses/{id}
```

Fields:

```text
purpose
amount
date
category
paymentMode
bankName
notes
createdAt
updatedAt
```

---

## UPCOMING PAYMENT

```text
users/{uid}/upcomingPayments/{id}
```

Fields:

```text
payerName
amount
dueDate
category
status
notes
createdAt
updatedAt
```

---

## INCOMING PAYMENT

```text
users/{uid}/incomingPayments/{id}
```

Fields:

```text
payerName
amount
expectedDate
status
notes
createdAt
updatedAt
```

---

## SAVINGS

```text
users/{uid}/savings/{id}
```

Fields:

```text
name
accountType
accountName
amount
createdAt
updatedAt
```

---

# 66. MONTHLY IDENTIFIER

Use:

```text
YYYY-MM
```

Example:

```text
2026-09
```

Use this for:

* Monthly targets
* Motivation
* 80% popup
* Monthly reporting

Do not delete previous monthly data.

---

# 67. CURRENCY

Only use:

# GBP (£)

Examples:

£12

£12.50

£1,250.00

Use UK formatting.

---

# 68. DATE FORMAT

Display dates as:

```text
DD/MM/YYYY
```

Example:

```text
21/09/2026
```

Store timestamps properly in Firebase.

Handle UK daylight saving time correctly.

---

# 69. DASHBOARD QUICK ACTIONS

Create prominent buttons:

```text
+ Add Work

+ Add Expense

+ Incoming Payment

+ Upcoming Payment

+ Add Savings
```

---

# 70. RECENT ACTIVITY

Show:

Example:

Today

+£60.00

ABC Cafe — Work

Today

-£12.50

Groceries

Yesterday

-£4.00

Transport

Use clear positive/negative indicators.

---

# 71. EMPTY STATES

No work:

"No work sessions yet."

Button:

"Add your first work session"

No expenses:

"No expenses recorded yet."

Button:

"Add expense"

No payments:

"No upcoming payments."

No savings:

"Your Savings Vault is empty."

---

# 72. CONFIRMATION

Before deleting:

Show confirmation modal.

Example:

"Are you sure you want to delete this expense?"

Buttons:

Cancel

Delete

---

# 73. TOASTS

After actions:

"Work session saved."

"Expense saved."

"Profile updated."

"Payment added."

"Savings added."

"Bank preference updated."

"Profile picture updated."

---

# 74. ERROR HANDLING

Never expose raw Firebase errors.

Convert them into friendly messages.

Example:

Firebase permission error:

"You don't have permission to access this information."

Network error:

"Please check your internet connection and try again."

---

# 75. LOADING STATES

Show loading UI for:

* Login
* Signup
* Dashboard
* Firestore reads
* Firestore writes
* Image uploads
* Savings unlock
* Admin data

Use skeletons/spinners where appropriate.

---

# 76. RESPONSIVE DESIGN

Mobile is a first-class experience.

Mobile:

* Cards stack
* Forms full width
* Tables become cards
* Charts resize
* Navigation becomes bottom navigation
* Add button easily accessible

Desktop:

* Sidebar
* Multi-column dashboard
* Large charts
* Spacious layout

---

# 77. DASHBOARD ORDER

Use this hierarchy:

1. Greeting
2. Current balance
3. Income/expense/savings cards
4. Work target
5. Earnings target
6. Smart motivation
7. Quick actions
8. Daily report
9. Monthly chart
10. Recent activity

The most important financial information must be visible immediately.

---

# 78. FINANCIAL INSIGHTS

Create:

# YOUR MONEY SNAPSHOT

Examples:

"You earned £1,240 this month."

"You spent £720 this month."

"You worked 62 hours."

"Your largest expense category is Groceries."

"Your average earning per work hour is £12.40."

Keep these as factual calculations.

---

# 79. WORK AVERAGE

Calculate:

```text
total earnings / total worked hours
```

Display:

Average earning per hour.

Do not confuse this with the user's contractual hourly rate.

---

# 80. PERFORMANCE OPTIMIZATION

Use Firestore efficiently.

Avoid:

* Downloading all data repeatedly
* Unnecessary listeners
* Recalculating everything on every render

Use:

* Queries
* Date filters
* Memoization
* Pagination where required

---

# 81. REAL-TIME UPDATES

When appropriate, use Firestore listeners so dashboard information updates immediately after:

* Adding work
* Editing work
* Adding expenses
* Editing expenses
* Adding payments

---

# 82. LOCAL STORAGE

Do NOT use localStorage as the main database.

It may only be used for non-sensitive UI preferences if needed.

Do not store:

* Passwords
* Savings PIN
* Financial records

in localStorage.

---

# 83. ADMIN SECURITY

Frontend:

Hide admin routes from normal users.

Backend/security:

Firestore rules must independently enforce admin permissions.

Never trust:

```text
role: admin
```

from frontend input.

---

# 84. ACCOUNT SECURITY

Never store:

* Passwords
* Firebase auth tokens manually
* Savings PIN plaintext
* Cloudinary secrets

Firebase Authentication manages passwords.

---

# 85. ACCESSIBILITY

Implement:

* Semantic HTML
* Labels
* Keyboard navigation
* Focus states
* Accessible modals
* Screen-reader-friendly forms
* Error messages
* Sufficient contrast

Do not communicate information using colour alone.

---

# 86. COMPONENT STRUCTURE

Recommended:

```text
src/
  components/
    layout/
    navigation/
    dashboard/
    work/
    expenses/
    payments/
    savings/
    profile/
    admin/
    reports/
    charts/
    ui/

  pages/
    Login.tsx
    Signup.tsx
    Dashboard.tsx
    Work.tsx
    Expenses.tsx
    UpcomingPayments.tsx
    IncomingPayments.tsx
    Reports.tsx
    Savings.tsx
    Profile.tsx
    Settings.tsx
    Admin.tsx

  services/
    firebase.ts
    authService.ts
    userService.ts
    workService.ts
    expenseService.ts
    paymentService.ts
    savingsService.ts
    adminService.ts
    cloudinaryService.ts

  hooks/
  types/
  utils/
  contexts/
  routes/
```

Adjust structure if a better architecture is appropriate.

---

# 87. AUTH CONTEXT

Create:

```text
AuthContext
```

It should expose:

* currentUser
* loading
* login
* signup
* logout

After authentication:

Fetch Firestore profile.

---

# 88. DASHBOARD CALCULATIONS

Create reusable utility functions:

```text
calculateDailyIncome()
calculateMonthlyIncome()
calculateDailyExpenses()
calculateMonthlyExpenses()
calculateMonthlyBalance()
calculateWorkingHours()
calculateTargetPercentage()
calculateProjectedBalance()
calculateAverageHourlyEarning()
```

Do not duplicate calculation logic throughout components.

---

# 89. TARGET CALCULATION

Example:

Target:

80 hours

Current:

64 hours

Calculation:

```text
64 / 80 × 100
```

=

80%

Display:

80%

---

# 90. DAILY CALCULATION

For each date:

```text
dailyIncome
dailyExpenses
dailyNet
```

Formula:

```text
dailyNet = dailyIncome - dailyExpenses
```

---

# 91. MONTHLY CALCULATION

```text
monthlyIncome
monthlyExpenses
monthlyNet
```

Formula:

```text
monthlyNet =
monthlyIncome - monthlyExpenses
```

---

# 92. PROJECTED BALANCE

```text
projectedBalance =
actualBalance
+ expectedIncoming
- upcomingPayments
```

Clearly label:

**PROJECTED**

Never present projected money as actual money.

---

# 93. SAVINGS SEPARATION

Savings must be displayed separately from monthly income/expense calculations.

Do not automatically subtract savings from monthly balance.

A user may save money without it being an expense.

---

# 94. DUPLICATE PREVENTION

Prevent accidental duplicate form submissions.

When saving:

Disable submit.

Show:

Saving...

Then re-enable after completion.

---

# 95. FIRESTORE INDEXES

Create necessary indexes for:

Work:

```text
workDate
createdAt
```

Expenses:

```text
date
category
createdAt
```

Upcoming payments:

```text
dueDate
status
```

Incoming payments:

```text
expectedDate
status
```

Only create composite indexes where Firestore requires them.

---

# 96. TEST USER FLOW

Test:

### USER

Signup

↓

Login

↓

Dashboard

↓

Set targets

↓

Add work

↓

Check calculated hours

↓

Check earnings

↓

Add expense

↓

Check balance

↓

Add incoming payment

↓

Add upcoming payment

↓

Check projected balance

↓

Set preferred bank

↓

Add card expense

↓

Verify bank preference

↓

Change preferred bank

↓

Add another expense

↓

Verify new bank

↓

Open Savings

↓

Create PIN

↓

Add saving

↓

Logout

↓

Login

↓

Open Savings

↓

PIN required

↓

Correct PIN

↓

Savings visible

---

# 97. ADMIN TEST

Create admin.

Login.

Verify admin dashboard.

Create Anand.

Logout.

Login as Anand.

Verify Anand cannot access admin.

Login as admin.

Verify user list.

Search Anand.

Open Anand.

Verify permitted information.

---

# 98. SECURITY TEST

Test:

User A tries to read User B's records.

Expected:

DENIED.

User A tries to update User B's record.

Expected:

DENIED.

User tries to change own role to admin.

Expected:

DENIED.

Unauthenticated user tries dashboard.

Expected:

REDIRECT.

Unauthenticated user tries admin.

Expected:

DENIED.

---

# 99. 80% TEST

Set target:

10 hours.

Add:

8 hours.

Expected:

80%.

Popup appears.

Close popup.

Refresh.

Popup must NOT repeatedly appear.

Add more hours.

Target remains achieved.

---

# 100. PRODUCTION QUALITY

Before finishing:

Remove:

* Console debugging
* Fake data
* Placeholder buttons
* Mock authentication
* Temporary UI
* Hardcoded user data
* Unused imports
* Unused dependencies
* Broken links
* TODO placeholders

Run:

* TypeScript checks
* Build
* Lint
* Security rule checks

Fix all errors.

---

# 101. README

Create a detailed README containing:

## Installation

## Environment variables

## Firebase setup

## Authentication setup

## Firestore setup

## Firestore security rules

## Cloudinary setup

## Upload preset setup

## Local development

## Production build

## Deployment

Explain exactly where the user needs to place credentials.

---

# 102. FINAL ENVIRONMENT TEMPLATE

Create:

```text
.env.example
```

Containing:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_CLOUDINARY_CLOUD_NAME=dlvjvskje
VITE_CLOUDINARY_UPLOAD_PRESET=THE POUNDS TRACKER
```

---

# 103. IMPORTANT FIREBASE NOTE

Use the provided Firebase project.

Do not create another Firebase project.

Do not use Firebase Storage for profile images.

Profile images must go to Cloudinary.

Firestore stores the Cloudinary URL.

---

# 104. IMPORTANT CLOUDINARY NOTE

Use:

Cloud name:

```text
dlvjvskje
```

Upload preset:

```text
THE POUNDS TRACKER
```

Do not require a Cloudinary API secret for the browser upload flow.

If the upload preset is not configured as an unsigned preset, clearly identify the configuration issue rather than exposing a secret in frontend code.

---

# 105. FINAL PRODUCT EXPERIENCE

When Anand opens THE POUNDSTRACKER:

### SPLASH

£

THE POUNDSTRACKER

↓

### LOGIN

Email / Username

Password

Login

Don't have an account?

Create account

↓

### DASHBOARD

Good evening, Anand.

Your balance:

# £530.00

This month:

Income
£1,250

Expenses
£720

Working hours
59 / 80

Target progress
73.75%

Motivation:

"You're getting close. Stay consistent."

↓

Quick Actions:

* Add Work

* Add Expense

* Incoming Payment

* Upcoming Payment

↓

Daily report

↓

Monthly chart

↓

Recent activity

---

# 106. CORE PRODUCT PRINCIPLE

THE POUNDSTRACKER must answer these questions immediately:

### HOW MUCH DID I EARN?

### HOW MUCH DID I SPEND?

### AM I POSITIVE OR NEGATIVE THIS MONTH?

Then provide:

### HOW MANY HOURS DID I WORK?

### HOW CLOSE AM I TO MY TARGET?

### WHAT PAYMENTS ARE COMING?

### WHAT MONEY AM I EXPECTING?

### HOW MUCH HAVE I SAVED?

The application should make tracking money extremely simple.

---

# 107. DEVELOPMENT INSTRUCTION

Build this application completely.

Do not stop after creating the UI.

Implement:

* Real Firebase authentication
* Real Firestore persistence
* Real Cloudinary uploads
* Real calculations
* Real reports
* Real admin functionality
* Real security rules
* Real user isolation
* Real savings PIN protection
* Real responsive design

If a feature requires Firebase configuration that cannot be completed from frontend code alone, clearly document the required Firebase Console configuration.

Do not replace unfinished functionality with fake/demo functionality.

---

# 108. BUILD ORDER

Follow this order:

### PHASE 1

Project initialization.

### PHASE 2

Design system.

### PHASE 3

Firebase configuration.

### PHASE 4

Authentication.

### PHASE 5

User profile.

### PHASE 6

Protected routing.

### PHASE 7

Admin system.

### PHASE 8

Work & earnings.

### PHASE 9

Monthly targets.

### PHASE 10

Motivation engine.

### PHASE 11

Expenses.

### PHASE 12

Payment preferences.

### PHASE 13

Upcoming payments.

### PHASE 14

Incoming payments.

### PHASE 15

Reports.

### PHASE 16

Savings Vault.

### PHASE 17

Cloudinary profile uploads.

### PHASE 18

Charts.

### PHASE 19

Security rules.

### PHASE 20

Responsive optimization.

### PHASE 21

Testing.

### PHASE 22

Production cleanup.

### PHASE 23

README/documentation.

---

# FINAL INSTRUCTION

Do not create a generic expense tracker.

Create:

# THE POUNDSTRACKER

A polished UK personal money and part-time earnings platform specifically designed around the way a UK student/worker may track their working hours, earnings, expenses, upcoming payments, incoming payments, monthly targets, and savings.

The user should be able to open the application every day and understand their financial position within seconds.

Every major feature must be functional, persistent, secure, responsive, and connected to Firebase/Cloudinary.

Build it as a real product, not a visual mockup.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
