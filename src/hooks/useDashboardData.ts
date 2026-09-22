import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscribeWorkSessions } from "../services/workService";
import { subscribeExpenses } from "../services/expenseService";
import { subscribeSavings } from "../services/savingsService";
import { subscribeUpcomingPayments, subscribeIncomingPayments } from "../services/paymentService";
import { getSettings } from "../services/userService";
import {
  calculateDailyIncome,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateMonthlyBalance,
  calculateWorkingHours,
  calculateTotalSavings,
  calculateProjectedBalance,
} from "../lib/calc";
import type { WorkSession, Expense, Saving, UpcomingPayment, IncomingPayment, UserSettings } from "../types";

export function useDashboardData() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([]);
  const [incoming, setIncoming] = useState<IncomingPayment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) return;

    let mounted = true;
    
    // Fetch settings (one-off, since it's not subscribed currently)
    getSettings(uid)
      .then((s) => {
        if (mounted) setSettings(s);
      })
      .catch((e) => {
        console.error("Failed to fetch settings", e);
      });

    // Subscribe to collections
    const unsubSessions = subscribeWorkSessions(uid, setSessions, setError);
    const unsubExpenses = subscribeExpenses(uid, setExpenses, setError);
    const unsubSavings = subscribeSavings(uid, setSavings, setError);
    const unsubUpcoming = subscribeUpcomingPayments(uid, setUpcoming, setError);
    const unsubIncoming = subscribeIncomingPayments(uid, setIncoming, setError);

    // Give it a short delay to load initial data, or we just set loading to false immediately
    // since Firestore subscriptions trigger synchronously with cache.
    setLoading(false);

    return () => {
      mounted = false;
      unsubSessions();
      unsubExpenses();
      unsubSavings();
      unsubUpcoming();
      unsubIncoming();
    };
  }, [uid]);

  const todayEarnings = calculateDailyIncome(sessions);
  const monthlyEarnings = calculateMonthlyIncome(sessions);
  const monthlyExpenses = calculateMonthlyExpenses(expenses);
  const monthlyBalance = calculateMonthlyBalance(sessions, expenses);
  const monthlyHours = calculateWorkingHours(sessions);
  const totalSavings = calculateTotalSavings(savings);
  const actualBalance = monthlyEarnings - monthlyExpenses; // Simplified for the month
  const projectedBalance = calculateProjectedBalance(actualBalance, incoming, upcoming);

  return {
    loading,
    error,
    settings,
    sessions,
    expenses,
    summary: {
      todayEarnings,
      monthlyEarnings,
      monthlyExpenses,
      monthlyBalance,
      monthlyHours,
      totalSavings,
      projectedBalance,
    },
  };
}
