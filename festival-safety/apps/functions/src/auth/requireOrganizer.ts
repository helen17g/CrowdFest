import { HttpsError } from "firebase-functions/v2/https";
import { db } from "../config/firebaseAdmin"; 

export async function requireOrganizer(eventId: string, uid: string) {
  if (!eventId || typeof eventId !== "string") {
    throw new HttpsError("invalid-argument", "eventId required.");
  }
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("unauthenticated", "Login required.");
  }

  const firestore = db();

  // Must be organizer for the event
  const memberSnap = await firestore
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnap.exists || memberSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer access required.");
  }

  return true;
}
