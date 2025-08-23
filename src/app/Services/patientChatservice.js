import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Firestore path helpers for new structure:
 * /profileData/{profileId}/Chats/{date-time}/Messages/{time}
 */
function formatDateKey(date = new Date()) {
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}
function formatTimeKey(date = new Date()) {
  return date.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
}
function getSessionId(date = new Date()) {
  return `${formatDateKey(date)}-${formatTimeKey(date)}`;
}

/**
 * Create or reuse a chat doc under /profileData/{profileId}/Chats/{date-time}
 * Returns the sessionId (date-time string)
 */
export async function createProfileChatSession(profileId, topic = "Chat") {
  const chatsCol = collection(db, "profileData", profileId, "Chats");
  // Try to find if a session for today exists and isn't ended
  const chatsSnap = await getDocs(query(chatsCol, orderBy("createdAt", "desc")));
  const todayPrefix = formatDateKey();
  let sessionId;
  let found = false;
  if (!chatsSnap.empty) {
    const todayChat = chatsSnap.docs.find((d) =>
      d.id.startsWith(todayPrefix) && !d.data().ended
    );
    if (todayChat) {
      sessionId = todayChat.id;
      found = true;
    }
  }
  if (!found) {
    sessionId = getSessionId();
    const chatRef = doc(db, "profileData", profileId, "Chats", sessionId);
    await setDoc(chatRef, {
      topic,
      createdAt: serverTimestamp(),
      ended: false,
      title: `Chat on ${new Date().toLocaleString()}`,
    }, { merge: true });
  }
  return sessionId;
}

/**
 * Save a single message in /profileData/{profileId}/Chats/{chatId}/Messages/{time}
 * Uses ChatBy and Message fields for compatibility.
 */
export async function saveProfileChatMessage(profileId, chatId, ChatBy, Message) {
  const now = new Date();
  const msgTime = formatTimeKey(now);
  const msgRef = doc(
    db,
    "profileData",
    profileId,
    "Chats",
    chatId,
    "Messages",
    msgTime
  );
  await setDoc(msgRef, {
    ChatBy,
    Message,
    timestamp: serverTimestamp(),
  });
}

/**
 * List chats for a profile (most recent first)
 */
export async function loadProfileChats(profileId, limitCount = 20) {
  const chatsCol = collection(db, "profileData", profileId, "Chats");
  const q = query(chatsCol, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}