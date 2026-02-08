import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";

// ✅ v1 auth trigger (works even if you use v2 elsewhere)
import { auth as authV1 } from "firebase-functions/v1";

// ✅ use Firestore FieldValue from admin SDK, not firebase-functions
import { FieldValue } from "firebase-admin/firestore";

import { db } from "./config/firebaseAdmin";

// Health check (v2)
export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "festival-safety-functions",
    time: new Date().toISOString(),
  });
});

// Create Firestore user doc on signup (v1 auth trigger)
export const createUserProfile = authV1.user().onCreate(async (user) => {
  const userRef = db().collection("users").doc(user.uid);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (snap.exists) return;

    tx.set(userRef, {
      role: "attendee",
      email: user.email ?? null,
      createdAt: new Date(),
    });
  });
});

function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

// 0) Set account type (v2 callable)
export const setAccountType = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const { accountType } = data;
  if (accountType !== "attendee" && accountType !== "organizer") {
    throw new HttpsError("invalid-argument", "accountType must be attendee or organizer.");
  }

  await db().collection("users").doc(auth.uid).set(
    {
      role: accountType,
      email: (auth.token.email as string | undefined) ?? null,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { ok: true };
});

// 1) Create event
export const createEvent = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const userSnap = await db().collection("users").doc(auth.uid).get();
  if (userSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer required.");
  }

  const { name, startsAt, endsAt } = data;
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new HttpsError("invalid-argument", "Event name required.");
  }

  const ref = db().collection("events").doc();
  const now = new Date();

  await ref.set({
    name: name.trim(),
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    createdBy: auth.uid,
    createdAt: now,
  });

  await ref.collection("members").doc(auth.uid).set({
    role: "organizer",
    joinedAt: now,
  });

  return { eventId: ref.id };
});

// 2) Create invite
export const createInvite = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const { eventId, role, maxUses } = data;
  if (!eventId || (role !== "attendee" && role !== "organizer")) {
    throw new HttpsError("invalid-argument", "Invalid invite data.");
  }

  const memberSnap = await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(auth.uid)
    .get();

  if (memberSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer access required.");
  }

  const code = makeCode();
  const inviteRef = db().collection("events").doc(eventId).collection("invites").doc();
  const now = new Date();

  await inviteRef.set({
    code,
    role,
    active: true,
    uses: 0,
    maxUses: typeof maxUses === "number" ? maxUses : null,
    createdAt: now,
    createdBy: auth.uid,
  });

  await db().collection("inviteCodes").doc(code).set({
    eventId,
    inviteId: inviteRef.id,
    role,
    active: true,
    createdAt: now,
  });

  return { code };
});

// 3) Join event
export const joinWithCode = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const code = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";
  if (!code) throw new HttpsError("invalid-argument", "Code required.");

  const snap = await db().collection("inviteCodes").doc(code).get();
  if (!snap.exists) throw new HttpsError("not-found", "Invalid code.");

  const { eventId, inviteId, role, active } = snap.data() as any;
  if (!active) throw new HttpsError("failed-precondition", "Invite is inactive.");

  await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(auth.uid)
    .set({ role, joinedAt: new Date() }, { merge: true });

  // ✅ increment uses using admin FieldValue
  await db()
    .collection("events")
    .doc(eventId)
    .collection("invites")
    .doc(inviteId)
    .update({ uses: FieldValue.increment(1) });

  return { eventId, role };
});

// Other routes
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";
