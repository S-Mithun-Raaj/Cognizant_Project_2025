import { NextResponse } from "next/server";
import { db } from "@/app/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

/**
 * POST → Save a message into Firestore (new structure, upper-case "Chats"/"Messages")
 * Expects: { profileId, chatId, ChatBy, Message }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { profileId, chatId, ChatBy, Message } = body;

    if (!profileId || !chatId || !ChatBy || !Message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use formatted time as doc ID
    const now = new Date();
    const msgTime = now.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });

    const messageRef = doc(
      db,
      "profileData",
      profileId,
      "Chats",
      chatId,
      "Messages",
      msgTime
    );

    await setDoc(messageRef, {
      ChatBy,
      Message,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}

/**
 * GET → Fetch all messages for a given chat
 * Usage: /api/Chat?profileId=abc123&chatId=xyz789
 * Uses new structure with "Chats"/"Messages"
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    const chatId = searchParams.get("chatId");

    if (!profileId || !chatId) {
      return NextResponse.json(
        { error: "Missing profileId or chatId" },
        { status: 400 }
      );
    }

    const messagesCol = collection(
      db,
      "profileData",
      profileId,
      "Chats",
      chatId,
      "Messages"
    );

    const q = query(messagesCol, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);

    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}