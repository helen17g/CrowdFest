import { logger } from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";

export async function notifyOrganizers(eventId: string, reportId: string) {
  // Minimal: write a "notification" doc organizers can listen to.
  const db = getFirestore();
  await db.collection("events").doc(eventId)
    .collection("notifications")
    .add({
      type: "NEW_REPORT",
      reportId,
      createdAt: new Date(),
      seenBy: []
    });

  logger.info("Notified organizers (db notification)", { eventId, reportId });
}
