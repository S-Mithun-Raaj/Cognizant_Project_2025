import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

// Create a new chat session document
export async function createChatSession(topic) {
  const sessionsCol = collection(db, "chatSessions");
  const docRef = await addDoc(sessionsCol, {
    topic,
    createdAt: new Date(),
  });
  return docRef.id;
}

// Save a message to a chat session
export async function saveMessage(sessionId, sender, text) {
  if (!sessionId) return;

  const messagesCol = collection(db, "chatSessions", sessionId, "messages");
  await addDoc(messagesCol, {
    sender,
    text,
    timestamp: new Date(),
  });
}

// Load all chat sessions (for sidebar)
export async function loadChatSessions() {
  const sessionsCol = collection(db, "chatSessions");
  const q = query(sessionsCol, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Load messages for a session
export async function loadMessages(sessionId) {
  const messagesCol = collection(db, "chatSessions", sessionId, "messages");
  const q = query(messagesCol, orderBy("timestamp", "asc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
