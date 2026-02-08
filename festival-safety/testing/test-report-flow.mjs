/**
 * Integration test for report flow using Firebase Emulators.
 *
 * Run:
 *   FIREBASE_PROJECT_ID="wics-hack26" node test-report-flow.mjs
 */

import assert from "node:assert/strict";

import { initializeApp } from "firebase/app";
import {
    getAuth,
    connectAuthEmulator,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import {
    getFirestore,
    connectFirestoreEmulator,
    doc,
    getDoc,         
    updateDoc,
    collection,
    getDocs,
    query,
    limit,
  } from "firebase/firestore";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
if (!PROJECT_ID) {
    console.error('❌ Set FIREBASE_PROJECT_ID, e.g. FIREBASE_PROJECT_ID="wics-hack26"');
    process.exit(1);
}

const ATTENDEE_EMAIL = "attendee@test.com";
const ORGANIZER_EMAIL = "organizer@test.com";
const PASSWORD = "password123";

function log(msg) {
    console.log(msg);
}

// Robust host:port parsing with defaults
function parseHostPort(value, defaultHost, defaultPort) {
    if (!value) return { host: defaultHost, port: defaultPort };
    const parts = value.split(":");
    if (parts.length === 1) return { host: parts[0], port: defaultPort };
    return { host: parts[0], port: Number(parts[1]) || defaultPort };
}

const AUTH = parseHostPort(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1", 9099);
const FS = parseHostPort(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1", 8080);
const FN = parseHostPort(process.env.FUNCTIONS_EMULATOR_HOST, "127.0.0.1", 5001);

function initClientApp(name) {
    const app = initializeApp(
        { projectId: PROJECT_ID, apiKey: "fake", authDomain: "localhost" },
        name
    );

    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${AUTH.host}:${AUTH.port}`, { disableWarnings: true });

    const db = getFirestore(app);
    connectFirestoreEmulator(db, FS.host, FS.port);

    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, FN.host, FN.port);

    return { auth, db, functions };
}

async function ensureUser(auth, email) {
    try {
        return (await createUserWithEmailAndPassword(auth, email, PASSWORD)).user;
    } catch {
        return (await signInWithEmailAndPassword(auth, email, PASSWORD)).user;
    }
}

async function main() {
    const attendee = initClientApp("attendee");
    const organizer = initClientApp("organizer");

    log("🔧 Creating/signing in users...");
    const attendeeUser = await ensureUser(attendee.auth, ATTENDEE_EMAIL);
    const organizerUser = await ensureUser(organizer.auth, ORGANIZER_EMAIL);

    log(`✅ Attendee UID:  ${attendeeUser.uid}`);
    log(`✅ Organizer UID: ${organizerUser.uid}`);

    // ✅ Mark organizer role via emulator-only callable
    log("🔧 Setting organizer role in /users/{uid} via setUserRoleTestFn...");
    const setUserRoleTestFn = httpsCallable(organizer.functions, "setUserRoleTestFn");
    const roleRes = await setUserRoleTestFn({ uid: organizerUser.uid, role: "organizer" });
    assert.equal(roleRes.data?.ok, true);

    // ✅ Create an event as organizer so they become events/{eventId}/members/{uid} organizer
    log("🔧 Creating test event via createEvent...");
    const createEventFn = httpsCallable(organizer.functions, "createEvent");
    const eventRes = await createEventFn({ name: "Test Event", startsAt: null, endsAt: null });
    const EVENT_ID = eventRes.data?.eventId;
    assert.ok(EVENT_ID, "Expected eventId from createEvent");
    log(`✅ Event created: ${EVENT_ID}`);

    // ---- 1) Create report ----
    log("\n🧪 Test 1: createReportFn");
    const createReportFn = httpsCallable(attendee.functions, "createReportFn");
    const createRes = await createReportFn({
        eventId: EVENT_ID,
        input: {
            urgency: "EMERGENCY",
            immediateDanger: true,
            category: "SAFETY/SECURITY",
            description: "Need help near lobby",
            location: { mode: "MANUAL", label: "Lobby" },
            contact: { needContactBack: true, method: "IN_APP_CHAT" },
        },
    });

    const reportId = createRes.data?.reportId;
    assert.ok(reportId, "Expected reportId from createReportFn");
    log(`✅ Report created: ${reportId}`);

    // ---- 2) Attendee cannot update report directly (rules) ----
    log("\n🧪 Test 2: attendee cannot update report directly");
    let denied = false;
    try {
        await updateDoc(doc(attendee.db, "events", EVENT_ID, "reports", reportId), { status: "RESOLVED" });
    } catch {
        denied = true;
    }
    assert.ok(denied, "Attendee should be denied updating report directly");
    log("✅ Update denied");

    // ---- 3) Organizer can list reports (rules) ----
    log("\n🧪 Test 3: organizer can list reports");
    const snap = await getDocs(query(collection(organizer.db, "events", EVENT_ID, "reports"), limit(5)));
    assert.ok(snap.size >= 1, "Organizer should see at least 1 report");
    log(`✅ Organizer can read reports (count=${snap.size})`);

    // ---- 4) Claim report ----
    log("\n🧪 Test 4: claimReportFn");
    const claimReportFn = httpsCallable(organizer.functions, "claimReportFn");
    const claimRes = await claimReportFn({ eventId: EVENT_ID, reportId });
    assert.equal(claimRes.data?.ok, true);
    log("✅ Report claimed");

    // ---- 5) Messaging ----
    log("\n🧪 Test 5: postReportMessageFn (attendee + organizer)");
    const postMsgA = httpsCallable(attendee.functions, "postReportMessageFn");
    const postMsgO = httpsCallable(organizer.functions, "postReportMessageFn");

    const msg1 = await postMsgA({ eventId: EVENT_ID, reportId, text: "I’m by the vending machines" });
    assert.equal(msg1.data?.ok, true);

    const msg2 = await postMsgO({ eventId: EVENT_ID, reportId, text: "On the way now" });
    assert.equal(msg2.data?.ok, true);

    const msgsSnap = await getDocs(
        query(collection(attendee.db, "events", EVENT_ID, "reports", reportId, "messages"), limit(10))
    );
    assert.ok(msgsSnap.size >= 2, "Expected at least 2 messages");
    log(`✅ Messages visible (count=${msgsSnap.size})`);

    // ---- 6) Resolve ----
    log("\n🧪 Test 6: resolveReportFn");
    const resolveReportFn = httpsCallable(organizer.functions, "resolveReportFn");
    const resolveRes = await resolveReportFn({
        eventId: EVENT_ID,
        reportId,
        resolutionCode: "RESOLVED_OK",
        resolutionSummary: "Escorted attendee safely",
    });
    assert.equal(resolveRes.data?.ok, true);


    // ---- 7) Sanity check: report status is RESOLVED in Firestore ----
    log("\n🧪 Test 7: verify report is RESOLVED in Firestore");

    const reportRef = doc(organizer.db, "events", EVENT_ID, "reports", reportId);
    const reportSnap = await getDoc(reportRef);

    assert.ok(reportSnap.exists(), "Resolved report doc should exist");

    const reportData = reportSnap.data();
    assert.equal(reportData.status, "RESOLVED", "Report status should be RESOLVED");
    assert.equal(reportData.closedByUid, organizerUser.uid, "closedByUid should be organizer");
    assert.ok(reportData.resolvedAt, "resolvedAt timestamp should be set");

    log("✅ Report persisted as RESOLVED");



    log("✅ Report resolved");
    log("\n🎉 ALL TESTS PASSED.");
}

main().catch((err) => {
    console.error("\n❌ TEST FAILED");
    console.error(err);
    process.exit(1);
});
