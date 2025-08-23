// src/app/lib/firebaseAdmin.js
import admin from "firebase-admin";

// 1. Load your private key JSON from environment variables or a service account file.
//    The simplest approach is to store the entire service account JSON in an env variable.
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// 2. Parse the JSON string if it exists
const serviceAccount = serviceAccountKey ? JSON.parse(serviceAccountKey) : null;

// 3. Initialize the Admin app only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
export const db = admin.firestore();
export default admin;