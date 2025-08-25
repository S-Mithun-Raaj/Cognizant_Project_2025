import { NextResponse } from "next/server";
import { summarize } from "@/Utils/summarizer"; // path: C:\Users\asus\Videos\Cognizant_Project\Cognizant_Project_2025\src\Utils\summarizer.js
import { db } from "@/firebaseConfig"; // path: C:\Users\asus\Videos\Cognizant_Project\Cognizant_Project_2025\src\firebaseConfig.js
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

    // 🔹 Save summary as a message
    await setDoc(doc(messagesRef, "summary"), {
      type: "summary",
      content: summary,
      timestamp: Date.now(),
    });

    return NextResponse.json({ summary, kept: lastN.length });
  } catch (err) {
    console.error("Summarize API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
