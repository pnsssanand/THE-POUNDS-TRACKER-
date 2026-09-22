/** Hash a savings PIN with SHA-256 and a per-user salt. Raw PIN is never stored. */
export async function hashPin(uid: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`poundstracker:${uid}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
