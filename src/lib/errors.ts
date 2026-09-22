export function friendlyError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (message === "FIREBASE_NOT_CONFIGURED" || code === "auth/invalid-api-key") {
    return "The app isn't connected to its account service yet. Add the Firebase web API key to continue.";
  }
  if (code.includes("permission-denied")) {
    return "You don't have permission to access this information.";
  }
  if (code.includes("network") || code === "auth/network-request-failed") {
    return "Please check your internet connection and try again.";
  }
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Those details don't match an account. Check your email and password.";
    case "auth/email-already-in-use":
      return "An account already exists with that email address.";
    case "auth/weak-password":
      return "Please choose a stronger password (at least 8 characters).";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/operation-not-allowed":
      return "Email and password sign-in is not enabled on the account service yet.";
    default:
      break;
  }
  if (message === "USERNAME_TAKEN") return "That username is already taken.";
  if (message === "USERNAME_NOT_FOUND") return "No account found with that username.";
  return "Something went wrong. Please try again.";
}
