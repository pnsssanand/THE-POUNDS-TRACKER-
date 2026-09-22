export type Role = "user" | "admin";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  photoURL?: string | null | undefined;
  photoPublicId?: string | null | undefined;
  phoneNumber?: string | null | undefined;
  role: Role;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  lastLoginAt?: string | undefined;
  disabled?: boolean | undefined;
}

export type PaymentMode = "cash" | "card";

export interface UserSettings {
  monthlyHoursTarget: number;
  monthlyEarningsTarget: number;
  preferredPaymentMode: PaymentMode;
  preferredBank: string;
  banks: string[];
  savingsPinHash?: string | null | undefined;
  last80PercentNotificationMonth?: string | null | undefined;
}

export interface WorkSession {
  id: string;
  companyName: string;
  workDate: string; // YYYY-MM-DD
  checkIn: string; // HH:mm
  checkOut: string; // HH:mm
  breakMinutes: number;
  hourlyRate: number;
  workedMinutes: number;
  workedHours: number;
  earnings: number;
  notes?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export type ExpenseCategory =
  | "Food"
  | "Groceries"
  | "Transport"
  | "Rent"
  | "Bills"
  | "Shopping"
  | "Entertainment"
  | "Education"
  | "Travel"
  | "Family"
  | "Health"
  | "Subscriptions"
  | "Other";

export interface Expense {
  id: string;
  purpose: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  bankName?: string | undefined;
  notes?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface UpcomingPayment {
  id: string;
  payerName: string;
  amount: number;
  dueDate: string;
  category: string;
  status: "pending" | "paid";
  notes?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface IncomingPayment {
  id: string;
  payerName: string;
  amount: number;
  expectedDate: string;
  status: "expected" | "received";
  notes?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface Saving {
  id: string;
  name: string;
  accountType: "cash" | "bank";
  accountName: string;
  amount: number;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface DailyReport {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  net: number;
  workedHours: number;
  sessions: number;
  averageDailyIncome: number;
  averageDailyExpenses: number;
  highestEarningDay: DailyReport | null;
  highestSpendingDay: DailyReport | null;
}

export interface DashboardSummary {
  todayEarnings: number;
  monthlyEarnings: number;
  monthlyExpenses: number;
  monthlyBalance: number;
  monthlyHours: number;
  totalSavings: number;
  projectedBalance: number;
}
