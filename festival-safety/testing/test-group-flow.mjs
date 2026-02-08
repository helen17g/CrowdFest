import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

// ---------- Firebase init ----------
const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099");

// ✅ Explicit region avoids “functions/not-found” if region mismatch
const functions = getFunctions(app, "us-central1");
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

const firestore = getFirestore(app);
connectFirestoreEmulator(firestore, "127.0.0.1", 8080);

// ---------- helpers ----------
async function ensureUser(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (e) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }
}

async function run() {
  console.log("🔧 Creating/signing in users...");
  const organizer = await ensureUser("org-group@demo.com", "password123");
  console.log("✅ Organizer UID:", organizer.uid);

  console.log("\n🧪 Calling createGroup...");
  const createGroup = httpsCallable(functions, "createGroup");
  const created = await createGroup({ name: "ACL Squad" });
  const { groupId, code } = created.data;
  console.log("✅ Created group:", { groupId, code });

  await auth.signOut();
  const attendee = await ensureUser("att-group@demo.com", "password123");
  console.log("\n✅ Attendee UID:", attendee.uid);

  console.log("\n🧪 Attendee reads members before join (should FAIL)...");
  try {
    const membersRef = collection(firestore, "groups", groupId, "members");
    await getDocs(membersRef);
    console.log("❌ Unexpected: attendee could read members before joining");
    process.exitCode = 1;
    return;
  } catch (e) {
    console.log("✅ Expected failure:", e.code || e.message);
  }

  console.log("\n🧪 Calling joinGroupWithCode...");
  const joinGroupWithCode = httpsCallable(functions, "joinGroupWithCode");
  const joined = await joinGroupWithCode({ code });
  console.log("✅ Joined:", joined.data);

  console.log("\n🧪 Attendee reads members after join (should SUCCEED)...");
  const membersRef = collection(firestore, "groups", groupId, "members");
  const membersSnap = await getDocs(membersRef);
  console.log("✅ members count:", membersSnap.size);
  membersSnap.forEach((d) => console.log(" - member doc:", d.id, d.data()));

  console.log("\n🧪 Attendee updates their own pin fields...");
  const myMemberDoc = doc(firestore, "groups", groupId, "members", attendee.uid);
  await updateDoc(myMemberDoc, {
    shareLocation: true,
    location: { lat: 30.2669, lng: -97.7729, label: "Zilker Park (ACL)" },
    updatedAt: new Date(),
  });
  console.log("✅ Updated own location");

  const membersSnap2 = await getDocs(membersRef);
  console.log("\n✅ members after pin update:");
  membersSnap2.forEach((d) => console.log(" - member doc:", d.id, d.data()));

  console.log("\n🎉 GROUP FLOW TEST PASSED");
}

run().catch((e) => {
  console.error("\n❌ TEST FAILED");
  console.error(e);
  process.exitCode = 1;
});
