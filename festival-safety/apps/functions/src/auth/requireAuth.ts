import { HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";

export function requireAuth(auth: CallableRequest["auth"]) {
  if (!auth) throw new HttpsError("unauthenticated", "Login required.");
}
