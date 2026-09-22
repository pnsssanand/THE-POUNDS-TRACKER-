import { orderBy } from "firebase/firestore";
import type { WorkSession } from "@/types";
import { computeWorkSessionTotals } from "@/lib/calc";
import {
  createDocument,
  deleteDocument,
  subscribeCollection,
  getCollection,
  updateDocument,
} from "./collectionService";

const NAME = "workSessions";

export type WorkSessionInput = Omit<
  WorkSession,
  "id" | "workedMinutes" | "workedHours" | "earnings" | "createdAt" | "updatedAt"
>;

export function subscribeWorkSessions(
  uid: string,
  onData: (rows: WorkSession[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<WorkSession>(uid, NAME, onData, onError, [orderBy("workDate", "desc")]);
}

export function getWorkSessions(uid: string): Promise<WorkSession[]> {
  return getCollection<WorkSession>(uid, NAME, [orderBy("workDate", "desc")]);
}

export function addWorkSession(uid: string, input: WorkSessionInput) {
  return createDocument(uid, NAME, { ...input, ...computeWorkSessionTotals(input) });
}

export function updateWorkSession(uid: string, id: string, input: WorkSessionInput) {
  return updateDocument(uid, NAME, id, { ...input, ...computeWorkSessionTotals(input) });
}

export function deleteWorkSession(uid: string, id: string) {
  return deleteDocument(uid, NAME, id);
}
