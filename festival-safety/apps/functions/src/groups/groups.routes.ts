import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db } from "../config/firebaseAdmin";

// ---------- Types ----------
type GroupCodeDoc = {
  groupId: string;
  active: boolean;
  createdAt: Date;
};

type GroupDoc = {
  name: string;
  createdBy: string;
  joinCode: string;
  createdAt: Date;
  updatedAt?: Date;
};

function randomGroupCode(len = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // avoid O/0/I/1 confusion
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueGroupCode() {
  for (let i = 0; i < 10; i++) {
    const code = randomGroupCode(6);
    const snap = await db().collection("groupCodes").doc(code).get();
    if (!snap.exists) return code;
  }
  throw new HttpsError("internal", "Could not generate unique group code.");
}

// ----------------------------------------------------
// 1) Create group
// ----------------------------------------------------
export const createGroup = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const name = typeof request.data?.name === "string" ? request.data.name.trim() : "";
  if (name.length < 2) throw new HttpsError("invalid-argument", "Group name required.");

  const code = await uniqueGroupCode();
  const groupRef = db().collection("groups").doc();
  const now = new Date();

  await db().runTransaction(async (tx) => {
    const groupData: GroupDoc = {
      name,
      createdBy: auth.uid,
      joinCode: code,
      createdAt: now,
    };

    const codeData: GroupCodeDoc = {
      groupId: groupRef.id,
      active: true,
      createdAt: now,
    };

    tx.set(groupRef, groupData);
    tx.set(db().collection("groupCodes").doc(code), codeData);

    tx.set(groupRef.collection("members").doc(auth.uid), {
      role: "organizer",
      joinedAt: now,
      shareLocation: false,
      location: null,
      updatedAt: now,
    });
  });

  return { groupId: groupRef.id, code };
});

// ----------------------------------------------------
// 2) Join group by code
// ----------------------------------------------------
export const joinGroupWithCode = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const code = typeof request.data?.code === "string" ? request.data.code.trim().toUpperCase() : "";
  if (!code) throw new HttpsError("invalid-argument", "Code required.");

  const codeRef = db().collection("groupCodes").doc(code);
  const codeSnap = await codeRef.get();

  if (!codeSnap.exists) {
    throw new HttpsError("not-found", "Invalid code.");
  }

  // ✅ FIX: codeSnap.data() might be undefined in TS type system, so guard & cast
  const codeData = codeSnap.data() as GroupCodeDoc | undefined;
  if (!codeData) {
    throw new HttpsError("not-found", "Invalid code.");
  }

  const { groupId, active } = codeData;
  if (!active) throw new HttpsError("failed-precondition", "Code inactive.");

  // (optional) validate group exists
  const groupSnap = await db().collection("groups").doc(groupId).get();
  if (!groupSnap.exists) throw new HttpsError("not-found", "Group not found.");

  await db()
    .collection("groups")
    .doc(groupId)
    .collection("members")
    .doc(auth.uid)
    .set(
      {
        role: "member",
        joinedAt: new Date(),
        shareLocation: false,
        location: null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

  return { groupId };
});

// ----------------------------------------------------
// 3) Regenerate group code (organizer only)
// ----------------------------------------------------
export const regenerateGroupCode = onCall(async (request) => {
  const auth = request.auth;
  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const groupId = typeof request.data?.groupId === "string" ? request.data.groupId.trim() : "";
  if (!groupId) throw new HttpsError("invalid-argument", "groupId required.");

  const memberSnap = await db().collection("groups").doc(groupId).collection("members").doc(auth.uid).get();
  if (!memberSnap.exists || memberSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer required.");
  }

  const newCode = await uniqueGroupCode();

  await db().runTransaction(async (tx) => {
    const groupRef = db().collection("groups").doc(groupId);
    const groupSnap = await tx.get(groupRef);
    if (!groupSnap.exists) throw new HttpsError("not-found", "Group not found.");

    // ✅ FIX: TS-safe access to joinCode
    const groupData = groupSnap.data() as GroupDoc | undefined;
    const oldCode = groupData?.joinCode;

    if (oldCode) {
      tx.set(db().collection("groupCodes").doc(oldCode), { active: false }, { merge: true });
    }

    tx.set(db().collection("groupCodes").doc(newCode), {
      groupId,
      active: true,
      createdAt: new Date(),
    });

    tx.set(
      groupRef,
      { joinCode: newCode, updatedAt: new Date() },
      { merge: true }
    );
  });

  return { code: newCode };
});
