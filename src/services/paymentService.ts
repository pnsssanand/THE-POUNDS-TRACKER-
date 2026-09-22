import { orderBy } from "firebase/firestore";
import type { IncomingPayment, UpcomingPayment } from "@/types";
import {
  createDocument,
  deleteDocument,
  getCollection,
  subscribeCollection,
  updateDocument,
} from "./collectionService";

const UPCOMING = "upcomingPayments";
const INCOMING = "incomingPayments";

export type UpcomingPaymentInput = Omit<UpcomingPayment, "id" | "createdAt" | "updatedAt">;
export type IncomingPaymentInput = Omit<IncomingPayment, "id" | "createdAt" | "updatedAt">;

export function subscribeUpcomingPayments(
  uid: string,
  onData: (rows: UpcomingPayment[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<UpcomingPayment>(uid, UPCOMING, onData, onError, [
    orderBy("dueDate", "asc"),
  ]);
}

export function getUpcomingPayments(uid: string): Promise<UpcomingPayment[]> {
  return getCollection<UpcomingPayment>(uid, UPCOMING, [
    orderBy("dueDate", "asc"),
  ]);
}

export function subscribeIncomingPayments(
  uid: string,
  onData: (rows: IncomingPayment[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<IncomingPayment>(uid, INCOMING, onData, onError, [
    orderBy("expectedDate", "asc"),
  ]);
}

export function getIncomingPayments(uid: string): Promise<IncomingPayment[]> {
  return getCollection<IncomingPayment>(uid, INCOMING, [
    orderBy("expectedDate", "asc"),
  ]);
}

export const addUpcomingPayment = (uid: string, input: UpcomingPaymentInput) =>
  createDocument(uid, UPCOMING, input);
export const updateUpcomingPayment = (
  uid: string,
  id: string,
  input: Partial<UpcomingPaymentInput>,
) => updateDocument(uid, UPCOMING, id, input);
export const deleteUpcomingPayment = (uid: string, id: string) =>
  deleteDocument(uid, UPCOMING, id);

export const addIncomingPayment = (uid: string, input: IncomingPaymentInput) =>
  createDocument(uid, INCOMING, input);
export const updateIncomingPayment = (
  uid: string,
  id: string,
  input: Partial<IncomingPaymentInput>,
) => updateDocument(uid, INCOMING, id, input);
export const deleteIncomingPayment = (uid: string, id: string) =>
  deleteDocument(uid, INCOMING, id);
