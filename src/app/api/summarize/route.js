import { NextResponse } from "next/server";
import { summarize } from "@/Utils/summarizer";
import { db } from "@/firebaseConfig";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { text, profileId, chatId, sentences = 5 } = await req.json();

    if (!text || !profileId || !chatId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // 🔹 Generate summary
    const summary = await summarize(text, sentences);

    // 🔹 Firestore path
    const messagesRef = collection(
      db,
      "profileData",
      profileId,
      "Chats",
      chatId,
      "Messages"
    );

    // Get all messages
    const snapshot = await getDocs(messagesRef);
    const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Keep last N messages (say last 10)
    const N = 10;
    const lastN = messages.slice(-N);

    // 🔹 Delete old messages
    for (const msg of messages.slice(0, -N)) {
      await deleteDoc(doc(messagesRef, msg.id));
    }

    // 🔹 Save summary under consistent schema
    //await setDoc(doc(messagesRef, "summary"), {
      //summary,
      //timestamp: new Date().toISOString(),
    //});
    // 🔹 Save summary under consistent schema with role=system
    await setDoc(doc(messagesRef, "summary"), {
      role: "system",
      summary,
      timestamp: new Date().toISOString(),
    });


    return NextResponse.json({ summary, kept: lastN.length });
  } catch (err) {
    console.error("Summarize API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
