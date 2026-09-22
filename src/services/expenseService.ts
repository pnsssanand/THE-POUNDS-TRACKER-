import { orderBy } from "firebase/firestore";
import type { Expense } from "@/types";
import {
  createDocument,
  deleteDocument,
  getCollection,
  subscribeCollection,
  updateDocument,
} from "./collectionService";

const NAME = "expenses";

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Rent",
  "Bills",
  "Shopping",
  "Entertainment",
  "Education",
  "Travel",
  "Family",
  "Health",
  "Subscriptions",
  "Other",
] as const;

export function subscribeExpenses(
  uid: string,
  onData: (rows: Expense[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<Expense>(uid, NAME, onData, onError, [orderBy("date", "desc")]);
}

export function getExpenses(uid: string): Promise<Expense[]> {
  return getCollection<Expense>(uid, NAME, [orderBy("date", "desc")]);
}

export const addExpense = (uid: string, input: ExpenseInput) => createDocument(uid, NAME, input);
export const updateExpense = (uid: string, id: string, input: ExpenseInput) =>
  updateDocument(uid, NAME, id, input);
export const deleteExpense = (uid: string, id: string) => deleteDocument(uid, NAME, id);
