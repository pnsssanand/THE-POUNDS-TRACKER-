import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type QueryConstraint,
} from "firebase/firestore";
import { getDb } from "./firebase";

export type WithId = { id: string };

function stripUndefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

export function subscribeCollection<T extends WithId>(
  uid: string,
  name: string,
  onData: (rows: T[]) => void,
  onError: (error: unknown) => void,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")],
): () => void {
  const ref = collection(getDb(), "users", uid, name);
  return onSnapshot(
    query(ref, ...constraints),
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T));
    },
    onError,
  );
}

export async function getCollection<T extends WithId>(
  uid: string,
  name: string,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")],
): Promise<T[]> {
  const ref = collection(getDb(), "users", uid, name);
  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);
}

export async function createDocument(
  uid: string,
  name: string,
  data: Record<string, unknown>,
): Promise<string> {
  const ref = await addDoc(collection(getDb(), "users", uid, name), {
    ...stripUndefined(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocument(
  uid: string,
  name: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(doc(getDb(), "users", uid, name, id), {
    ...stripUndefined(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(uid: string, name: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "users", uid, name, id));
}
