import type { Saving } from "@/types";
import {
  createDocument,
  deleteDocument,
  subscribeCollection,
  getCollection,
  updateDocument,
} from "./collectionService";

const NAME = "savings";

export type SavingInput = Omit<Saving, "id" | "createdAt" | "updatedAt">;

export function subscribeSavings(
  uid: string,
  onData: (rows: Saving[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<Saving>(uid, NAME, onData, onError);
}

export function getSavings(uid: string): Promise<Saving[]> {
  return getCollection<Saving>(uid, NAME);
}

export const addSaving = (uid: string, input: SavingInput) => createDocument(uid, NAME, input);
export const updateSaving = (uid: string, id: string, input: Partial<SavingInput>) =>
  updateDocument(uid, NAME, id, input);
export const deleteSaving = (uid: string, id: string) => deleteDocument(uid, NAME, id);
