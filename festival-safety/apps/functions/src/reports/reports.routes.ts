import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireAuth } from "../auth/requireAuth";
import { requireOrganizer } from "../auth/requireOrganizer";
import { createReport, claimReport, resolveReport, postReportMessage } from "./reports.service";
import { CreateReportInput } from "./reports.types";

export const createReportFn = onCall(async (req) => {
  requireAuth(req.auth);

  const { eventId, input } = req.data as { eventId?: string; input?: CreateReportInput };
  if (!eventId || !input) {
    throw new HttpsError("invalid-argument", "eventId and input required.");
  }

  return await createReport(eventId, req.auth!.uid, input);
});

export const claimReportFn = onCall(async (req) => {
  requireAuth(req.auth);

  const { eventId, reportId } = req.data as { eventId?: string; reportId?: string };
  if (!eventId || !reportId) {
    throw new HttpsError("invalid-argument", "eventId & reportId required.");
  }

  // ✅ must be organizer for THIS event
  await requireOrganizer(eventId, req.auth!.uid);

  return await claimReport(eventId, reportId, req.auth!.uid);
});

export const resolveReportFn = onCall(async (req) => {
  requireAuth(req.auth);

  const { eventId, reportId, resolutionCode, resolutionSummary } = req.data as {
    eventId?: string;
    reportId?: string;
    resolutionCode?: string;
    resolutionSummary?: string;
  };

  if (!eventId || !reportId) {
    throw new HttpsError("invalid-argument", "eventId & reportId required.");
  }
  if (!resolutionCode || !resolutionSummary) {
    throw new HttpsError("invalid-argument", "resolutionCode & resolutionSummary required.");
  }

  // ✅ must be organizer for THIS event
  await requireOrganizer(eventId, req.auth!.uid);

  return await resolveReport(eventId, reportId, req.auth!.uid, resolutionCode, resolutionSummary);
});

export const postReportMessageFn = onCall(async (req) => {
  requireAuth(req.auth);

  const { eventId, reportId, text } = req.data as {
    eventId?: string;
    reportId?: string;
    text?: string;
  };

  if (!eventId || !reportId) {
    throw new HttpsError("invalid-argument", "eventId & reportId required.");
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new HttpsError("invalid-argument", "text is required.");
  }

  // ✅ Decide senderRole based on event membership (not token claims)
  // If you only allow organizers to call certain functions anyway, this stays correct.
  // For messaging, we treat them as ORGANIZER only if they're an organizer member in this event.
  let senderRole: "ATTENDEE" | "ORGANIZER" = "ATTENDEE";
  try {
    await requireOrganizer(eventId, req.auth!.uid);
    senderRole = "ORGANIZER";
  } catch {
    senderRole = "ATTENDEE";
  }

  return await postReportMessage(eventId, reportId, req.auth!.uid, senderRole, text);
});
