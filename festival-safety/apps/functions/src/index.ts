import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";

// ✅ v1 auth trigger (works even if you use v2 elsewhere)
import { auth as authV1 } from "firebase-functions/v1";

// ✅ use Firestore FieldValue from admin SDK, not firebase-functions
import { FieldValue } from "firebase-admin/firestore";

import { db } from "./config/firebaseAdmin";

<<<<<<< HEAD
// Health check (v2)
=======
// ----------------------------------------------------
// Health check (v2)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "festival-safety-functions",
    time: new Date().toISOString(),
  });
});

<<<<<<< HEAD
// Create Firestore user doc on signup (v1 auth trigger)
=======
// ----------------------------------------------------
// Create Firestore user doc on signup (v1 auth trigger)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
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

<<<<<<< HEAD
=======
// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

<<<<<<< HEAD
// 0) Set account type (v2 callable)
=======
// ----------------------------------------------------
// 0) Set account type (v2 callable)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
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

<<<<<<< HEAD
// 1) Create event
=======
// ----------------------------------------------------
// 1) Create event
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
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

<<<<<<< HEAD
// 2) Create invite
=======
// ----------------------------------------------------
// 2) Create invite
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const createInvite = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const { eventId, role, maxUses } = data;
  if (!eventId || (role !== "attendee" && role !== "organizer")) {
    throw new HttpsError("invalid-argument", "Invalid invite data.");
  }

<<<<<<< HEAD
  const memberSnap = await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(auth.uid)
    .get();

=======
  const memberSnap = await db().collection("events").doc(eventId).collection("members").doc(auth.uid).get();
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
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

<<<<<<< HEAD
// 3) Join event
=======
// ----------------------------------------------------
// 3) Join event
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const joinWithCode = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const code = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";
  if (!code) throw new HttpsError("invalid-argument", "Code required.");

  const snap = await db().collection("inviteCodes").doc(code).get();
  if (!snap.exists) throw new HttpsError("not-found", "Invalid code.");

<<<<<<< HEAD
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
=======
  const inviteData = snap.data() as
    | { eventId: string; inviteId: string; role: "attendee" | "organizer"; active: boolean }
    | undefined;

  if (!inviteData) throw new HttpsError("not-found", "Invalid code.");
  if (!inviteData.active) throw new HttpsError("failed-precondition", "Invite is inactive.");

  const { eventId, inviteId, role } = inviteData;

  await db().collection("events").doc(eventId).collection("members").doc(auth.uid).set(
    { role, joinedAt: new Date() },
    { merge: true }
  );

  await db().collection("events").doc(eventId).collection("invites").doc(inviteId).update({
    uses: FieldValue.increment(1),
  });
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4

  return { eventId, role };
});

<<<<<<< HEAD
// Other routes
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";
=======
// ----------------------------------------------------
// Other routes (re-exports)
// ----------------------------------------------------
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";

// ----------------------------------------------------
// Groups (NEW)
// ----------------------------------------------------
export { createGroup, joinGroupWithCode, regenerateGroupCode } from "./groups/groups.routes";
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
