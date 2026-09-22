import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import {
  createUserRecords,
  isUsernameAvailable,
  normaliseUsername,
  resolveEmailFromUsername,
  touchLastLogin,
} from "./userService";

export function watchAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signUp(params: {
  fullName: string;
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  const username = normaliseUsername(params.username);
  if (!(await isUsernameAvailable(username))) throw new Error("USERNAME_TAKEN");
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    params.email.trim(),
    params.password,
  );
  await updateProfile(credential.user, { displayName: params.fullName });
  await createUserRecords({
    uid: credential.user.uid,
    email: params.email.trim(),
    username,
    displayName: params.fullName,
  });
  return credential.user;
}

export async function login(identifier: string, password: string): Promise<User> {
  const value = identifier.trim();
  const email = value.includes("@") ? value : await resolveEmailFromUsername(value);
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await touchLastLogin(credential.user.uid).catch(() => undefined);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(getFirebaseAuth());
}
