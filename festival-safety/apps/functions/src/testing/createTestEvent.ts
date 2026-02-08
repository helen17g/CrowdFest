import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const createTestEventFn = onCall(async (req) => {
  if (!process.env.FUNCTIONS_EMULATOR) {
    throw new HttpsError("permission-denied", "Emulator-only function");
  }

  const { eventId } = req.data as { eventId?: string };
  if (!eventId) throw new HttpsError("invalid-argument", "eventId is required");

  const db = getFirestore();
  await db.collection("events").doc(eventId).set(
    { name: "Test Event", createdAt: FieldValue.serverTimestamp() },
    { merge: true }
  );

  return { ok: true };
});
