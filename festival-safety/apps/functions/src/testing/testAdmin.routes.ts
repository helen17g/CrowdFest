import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function ensureAdmin() {
  if (getApps().length === 0) {
    initializeApp(); // emulator will provide env; no creds needed
  }
  return getFirestore();
}

export const setUserRoleTestFn = onCall(async (req) => {
  // Emulator-only safety
  if (!process.env.FUNCTIONS_EMULATOR) {
    throw new HttpsError("permission-denied", "Emulator-only");
  }

  const { uid, role } = req.data as { uid?: string; role?: "organizer" | "attendee" };
  if (!uid || (role !== "organizer" && role !== "attendee")) {
    throw new HttpsError("invalid-argument", "uid and role are required");
  }

  const fs = ensureAdmin();
  await fs.collection("users").doc(uid).set({ role }, { merge: true });

  return { ok: true };
});
