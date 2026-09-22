import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDb, firebaseConfig } from "./firebase";
import { createUserRecords, isUsernameAvailable, normaliseUsername } from "./userService";
import type { Expense, Role, Saving, UserProfile, WorkSession } from "@/types";

function mapProfile(id: string, data: Record<string, unknown>): UserProfile {
  const toISO = (value: unknown): string | undefined => {
    if (value && typeof value === "object" && "toDate" in value) {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    return typeof value === "string" ? value : undefined;
  };
  return {
    uid: id,
    username: String(data["username"] ?? ""),
    email: String(data["email"] ?? ""),
    displayName: String(data["displayName"] ?? ""),
    photoURL: (data["photoURL"] as string | null) ?? null,
    phoneNumber: (data["phoneNumber"] as string | null) ?? null,
    role: data["role"] === "admin" ? "admin" : "user",
    createdAt: toISO(data["createdAt"]),
    updatedAt: toISO(data["updatedAt"]),
    lastLoginAt: toISO(data["lastLoginAt"]),
  };
}

export async function listUsers(max = 200): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(getDb(), "users"), orderBy("createdAt", "desc"), limit(max)),
  );
  return snap.docs.map((d) => mapProfile(d.id, d.data() as Record<string, unknown>));
}

export async function getUserOverview(uid: string): Promise<{
  workSessions: WorkSession[];
  expenses: Expense[];
  savingsCount: number;
}> {
  const db = getDb();
  const [work, expenses, savings] = await Promise.all([
    getDocs(collection(db, "users", uid, "workSessions")),
    getDocs(collection(db, "users", uid, "expenses")),
    getDocs(collection(db, "users", uid, "savings")),
  ]);
  return {
    workSessions: work.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as WorkSession),
    expenses: expenses.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Expense),
    savingsCount: savings.docs.length as number,
  };
}

export type { Saving };

/**
 * Creates the auth account on a secondary Firebase app so the signed-in admin
 * session is never replaced. The temporary password is never persisted.
 */
export async function createUserAsAdmin(params: {
  fullName: string;
  username: string;
  email: string;
  temporaryPassword: string;
  role: Role;
}): Promise<string> {
  const username = normaliseUsername(params.username);
  if (!(await isUsernameAvailable(username))) throw new Error("USERNAME_TAKEN");

  const secondary = initializeApp(firebaseConfig, `admin-create-${Date.now()}`);
  try {
    const credential = await createUserWithEmailAndPassword(
      getAuth(secondary),
      params.email.trim(),
      params.temporaryPassword,
    );
    await createUserRecords({
      uid: credential.user.uid,
      email: params.email.trim(),
      username,
      displayName: params.fullName,
      role: params.role,
    });
    await signOut(getAuth(secondary));
    return credential.user.uid;
  } finally {
    await deleteApp(secondary).catch(() => undefined);
  }
}
