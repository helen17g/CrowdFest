import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { CreateReportInput } from "./reports.types";
import { db } from "../config/firebaseAdmin"; // <-- adjust path if needed

function requireString(val: any, name: string) {
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }
}

export async function createReport(eventId: string, uid: string, input: CreateReportInput) {
  requireString(eventId, "eventId");
  requireString(uid, "uid");
  requireString(input?.description, "description");

  const firestore = db();
  const reportRef = firestore.collection("events").doc(eventId).collection("reports").doc();

  const now = FieldValue.serverTimestamp();

  await reportRef.set({
    createdAt: now,
    updatedAt: now,
    createdByUid: uid,

    status: "OPEN",

    urgency: input.urgency,
    immediateDanger: !!input.immediateDanger,
    category: input.category,
    description: input.description,

    location: {
      mode: input.location?.mode ?? "MANUAL",
      label: input.location?.label ?? null,
      lat: input.location?.lat ?? null,
      lng: input.location?.lng ?? null,
      accuracyM: input.location?.accuracyM ?? null,
    },

    contact: {
      needContactBack: !!input.contact?.needContactBack,
      method: input.contact?.method ?? "IN_APP_CHAT",
      value: input.contact?.value ?? null,
    },

    claimedByUid: null,
    claimedAt: null,

    resolvedAt: null,
    resolutionCode: null,
    resolutionSummary: null,
    closedByUid: null,
  });

  return { reportId: reportRef.id };
}

export async function claimReport(eventId: string, reportId: string, organizerUid: string) {
  requireString(eventId, "eventId");
  requireString(reportId, "reportId");
  requireString(organizerUid, "organizerUid");

  const firestore = db();
  const reportRef = firestore.collection("events").doc(eventId).collection("reports").doc(reportId);

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(reportRef);
    if (!snap.exists) throw new HttpsError("not-found", "Report not found.");

    const report = snap.data()!;
    if (report.status !== "OPEN") {
      throw new HttpsError("failed-precondition", `Report is not OPEN (status=${report.status}).`);
    }

    tx.update(reportRef, {
      status: "CLAIMED",
      claimedByUid: organizerUid,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // action log
    const actionRef = reportRef.collection("actions").doc();
    tx.set(actionRef, {
      at: FieldValue.serverTimestamp(),
      byUid: organizerUid,
      type: "CLAIMED",
      details: "Organizer claimed the report",
    });
  });

  return { ok: true };
}

export async function resolveReport(
  eventId: string,
  reportId: string,
  organizerUid: string,
  resolutionCode: string,
  resolutionSummary: string
) {
  requireString(eventId, "eventId");
  requireString(reportId, "reportId");
  requireString(organizerUid, "organizerUid");
  requireString(resolutionCode, "resolutionCode");
  requireString(resolutionSummary, "resolutionSummary");

  const firestore = db();
  const reportRef = firestore.collection("events").doc(eventId).collection("reports").doc(reportId);

  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(reportRef);
    if (!snap.exists) throw new HttpsError("not-found", "Report not found.");

    const report = snap.data()!;
    if (report.claimedByUid !== organizerUid) {
      throw new HttpsError("permission-denied", "Only the claiming organizer can resolve.");
    }
    if (report.status === "RESOLVED" || report.status === "CLOSED") {
      throw new HttpsError("failed-precondition", "Report already resolved/closed.");
    }

    tx.update(reportRef, {
      status: "RESOLVED",
      resolutionCode,
      resolutionSummary,
      resolvedAt: FieldValue.serverTimestamp(),
      closedByUid: organizerUid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const actionRef = reportRef.collection("actions").doc();
    tx.set(actionRef, {
      at: FieldValue.serverTimestamp(),
      byUid: organizerUid,
      type: "RESOLVED",
      details: resolutionSummary,
    });
  });

  return { ok: true };
}

export async function postReportMessage(
  eventId: string,
  reportId: string,
  senderUid: string,
  senderRole: "ATTENDEE" | "ORGANIZER",
  text: string
) {
  requireString(eventId, "eventId");
  requireString(reportId, "reportId");
  requireString(senderUid, "senderUid");

  if (typeof text !== "string" || text.trim().length === 0) {
    throw new HttpsError("invalid-argument", "text is required.");
  }

  const firestore = db();
  const reportRef = firestore.collection("events").doc(eventId).collection("reports").doc(reportId);

  const reportSnap = await reportRef.get();
  if (!reportSnap.exists) throw new HttpsError("not-found", "Report not found.");

  const report = reportSnap.data()!;
  if (senderRole === "ATTENDEE" && report.createdByUid !== senderUid) {
    throw new HttpsError("permission-denied", "You can only message your own report.");
  }

  const msgRef = reportRef.collection("messages").doc();
  await msgRef.set({
    at: FieldValue.serverTimestamp(),
    senderRole,
    senderUid,
    text: text.trim(),
  });

  await reportRef.update({ updatedAt: FieldValue.serverTimestamp() });

  return { ok: true, messageId: msgRef.id };
}
