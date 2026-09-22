import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { UserProfile, UserSettings } from "@/types";

export const DEFAULT_BANKS = [
  "HSBC",
  "Barclays",
  "Lloyds",
  "NatWest",
  "Monzo",
  "Revolut",
  "Santander",
  "Starling",
];

export const DEFAULT_SETTINGS: UserSettings = {
  monthlyHoursTarget: 0,
  monthlyEarningsTarget: 0,
  preferredPaymentMode: "cash",
  preferredBank: "",
  banks: DEFAULT_BANKS,
  savingsPinHash: null,
  last80PercentNotificationMonth: null,
};

export function normaliseUsername(username: string): string {
  return username.trim().toLowerCase();
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), "usernames", normaliseUsername(username)));
  return !snap.exists();
}

export async function resolveEmailFromUsername(username: string): Promise<string> {
  const snap = await getDoc(doc(getDb(), "usernames", normaliseUsername(username)));
  const data = snap.data();
  if (!snap.exists() || !data?.["email"]) throw new Error("USERNAME_NOT_FOUND");
  return String(data["email"]);
}

export async function createUserRecords(params: {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  role?: "user" | "admin";
}): Promise<void> {
  const db = getDb();
  const username = normaliseUsername(params.username);
  await setDoc(doc(db, "users", params.uid), {
    uid: params.uid,
    email: params.email,
    username,
    displayName: params.displayName,
    photoURL: null,
    phoneNumber: null,
    role: params.role ?? "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
  await setDoc(doc(db, "usernames", username), { uid: params.uid, email: params.email });
  await setDoc(doc(db, "users", params.uid, "settings", "profile"), DEFAULT_SETTINGS);
}

function toISO(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : undefined;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getDb(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    username: String(data["username"] ?? ""),
    email: String(data["email"] ?? ""),
    displayName: String(data["displayName"] ?? ""),
    photoURL: (data["photoURL"] as string | null) ?? null,
    photoPublicId: (data["photoPublicId"] as string | null) ?? null,
    phoneNumber: (data["phoneNumber"] as string | null) ?? null,
    role: data["role"] === "admin" ? "admin" : "user",
    createdAt: toISO(data["createdAt"]),
    updatedAt: toISO(data["updatedAt"]),
    lastLoginAt: toISO(data["lastLoginAt"]),
  };
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "phoneNumber" | "photoURL" | "photoPublicId">>,
): Promise<void> {
  await setDoc(
    doc(getDb(), "users", uid),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function touchLastLogin(uid: string): Promise<void> {
  await setDoc(doc(getDb(), "users", uid), { lastLoginAt: serverTimestamp() }, { merge: true });
}

export async function getSettings(uid: string): Promise<UserSettings> {
  const snap = await getDoc(doc(getDb(), "users", uid, "settings", "profile"));
  if (!snap.exists()) return { ...DEFAULT_SETTINGS };
  const data = snap.data();
  return {
    monthlyHoursTarget: Number(data["monthlyHoursTarget"] ?? 0),
    monthlyEarningsTarget: Number(data["monthlyEarningsTarget"] ?? 0),
    preferredPaymentMode: data["preferredPaymentMode"] === "card" ? "card" : "cash",
    preferredBank: String(data["preferredBank"] ?? ""),
    banks: Array.isArray(data["banks"]) ? (data["banks"] as string[]) : DEFAULT_BANKS,
    savingsPinHash: (data["savingsPinHash"] as string | null) ?? null,
    last80PercentNotificationMonth: (data["last80PercentNotificationMonth"] as string | null) ?? null,
  };
}

export async function updateSettings(uid: string, patch: Partial<UserSettings>): Promise<void> {
  await setDoc(doc(getDb(), "users", uid, "settings", "profile"), patch, { merge: true });
}

export async function findUsersByQuery(term: string): Promise<UserProfile[]> {
  const db = getDb();
  const value = term.trim().toLowerCase();
  const results = new Map<string, UserProfile>();
  const fields: Array<[string, string]> = [
    ["username", value],
    ["email", value],
  ];
  for (const [field, val] of fields) {
    const snap = await getDocs(
      query(collection(db, "users"), where(field, ">=", val), where(field, "<=", `${val}\uf8ff`), limit(10)),
    );
    snap.forEach((d) => {
      const profile = { uid: d.id, ...(d.data() as Record<string, unknown>) } as unknown as UserProfile;
      results.set(d.id, profile);
    });
  }
  return [...results.values()];
}
