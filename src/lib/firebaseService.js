import { collection, addDoc, doc, setDoc, getDoc, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Create a new chat session
export async function createChatSession(userInfo, messages) {
  const docRef = await addDoc(collection(db, "chatSessions"), {
    createdAt: new Date(),
    userInfo,
    messages,
  });
  return docRef.id;
}

// Update chat session messages
export async function updateChatSession(sessionId, messages) {
  const docRef = doc(db, "chatSessions", sessionId);
  await setDoc(docRef, { messages }, { merge: true });
}

// Get recent chat sessions (limited)
export async function getRecentChatSessions(limitCount = 10) {
  const q = query(collection(db, "chatSessions"), orderBy("createdAt", "desc"), limit(limitCount));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Get chat session by ID
export async function getChatSessionById(sessionId) {
  const docRef = doc(db, "chatSessions", sessionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}
