'use client';

import "bootstrap/dist/css/bootstrap.min.css";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
  writeBatch,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./gs.css";
import { API_URL } from "./config";

// Helpers for consistent Firestore keys and session IDs
function formatDateKey(date = new Date()) {
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}
function formatTimeKey(date = new Date()) {
  return date.toLocaleTimeString("en-GB", { hour12: false });
}
function getSessionId(date = new Date()) {
  return `${formatDateKey(date)}-${formatTimeKey(date)}`;
}

// Helper for structured session history
const getStructuredHistory = (messages) => {
  return messages.map(msg => ({
    role: msg.role === "user" || msg.ChatBy === "User" ? "user" : "assistant",
    content: msg.content || msg.Message,
    timestamp: msg.timestamp?.toDate?.()?.toISOString?.() || new Date().toISOString()
  }));
};

const callSummarizeAPI = async (text, profileId, chatId) => {
  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, profileId, chatId, sentences: 5 }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.summary || "";
  } catch {
    return "";
  }
};

export default function ChatbotPage({ profileId }) {
  const chatRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const currentUtterRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const GIF_FADE_MS = -16000; // Duration for GIF fade-out

  // States
  const [userProfileId, setUserProfileId] = useState(profileId || null);
  const [messages, setMessages] = useState([
    { id: "init-bot-msg", role: "assistant", content: "Hello! I'm Alpha, your AI assistant. How can I help you?" },
  ]);
  const [summary, setSummary] = useState(""); // RAG summary state
  const [input, setInput] = useState("");
  const [chatTopics, setChatTopics] = useState([]);
  const [chatId, setChatId] = useState(null);
  const activeChatEnded = !!chatTopics.find((c) => c.id === chatId && c.ended);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [gifKey, setGifKey] = useState(0);

  // Load profile ID from localStorage if not provided
  useEffect(() => {
    if (!userProfileId && typeof window !== "undefined") {
      const storedId = localStorage.getItem("selectedProfileId");
      if (!storedId) {
        alert("No profile selected! Please go to Profile Manager and select a profile.");
        return;
      }
      setUserProfileId(storedId);
    }
  }, [userProfileId]);

  // Load and listen chat sessions list
  useEffect(() => {
    if (!userProfileId) return;
    let unsubHistory = null;
    let isMounted = true;

    async function setupChats() {
      try {
        const chatsRef = collection(db, "profileData", userProfileId, "Chats");
        const chatsSnap = await getDocs(query(chatsRef, orderBy("createdAt", "desc")));
        let currentChatId = null;
        let chatWasEnded = false;

        if (!chatsSnap.empty) {
          const todayPrefix = formatDateKey();
          const todayChat = chatsSnap.docs.find((d) =>
            d.id.startsWith(todayPrefix) && !d.data().ended
          );
          if (todayChat) {
            currentChatId = todayChat.id;
            chatWasEnded = false;
          } else {
            chatWasEnded = true;
          }
        } else {
          chatWasEnded = true;
        }

        if (chatWasEnded) {
          const now = new Date();
          const sessionId = getSessionId(now);
          const chatRefObj = doc(db, "profileData", userProfileId, "Chats", sessionId);
          await setDoc(chatRefObj, {
            createdAt: serverTimestamp(),
            ended: false,
            title: `Chat on ${now.toLocaleString()}`,
          }, { merge: true });
          currentChatId = sessionId;
        }

        if (isMounted) setChatId(currentChatId);

        unsubHistory = onSnapshot(query(chatsRef, orderBy("createdAt", "desc")), (snapshot) => {
          if (!isMounted) return;
          setChatTopics(
            snapshot.docs.map((d) => {
              const data = d.data();
              const title = data.title || `Chat on ${data.createdAt?.toDate?.()?.toLocaleString?.() || "Unknown date"}`;
              return {
                id: d.id,
                title,
                ended: data.ended,
              };
            })
          );
        });
      } catch (err) {
        console.error("setupChats error:", err);
      }
    }

    setupChats();

    return () => {
      isMounted = false;
      if (unsubHistory) unsubHistory();
    };
  }, [userProfileId]);

  // Listen to messages for current chat/session & load summary from Firestore if available
  useEffect(() => {
    if (!userProfileId || !chatId) return;
    const messagesRef = collection(db, "profileData", userProfileId, "Chats", chatId, "Messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    let unsub = onSnapshot(q, (snapshot) => {
      // Filter out summary document from messages list
      const firestoreMessages = snapshot.docs
        .filter(d => d.id !== "summary")
        .map(d => {
          const data = d.data();
          // Always use unified schema
          return {
            id: d.id,
            role: data.role || (data.ChatBy === "User" ? "user" : "assistant"),
            content: data.content || data.Message,
            timestamp: data.timestamp,
            processing: data.processing || false,
          }
        });
      if (firestoreMessages.length > 0) {
        setMessages(firestoreMessages);
      } else {
        setMessages([
          { id: "init-bot-msg", role: "assistant", content: "Hello! I'm Alpha, your AI assistant. How can I help you?" }
        ]);
      }
    }, (err) => {
      console.error("messages onSnapshot error:", err);
    });

    // Load summary doc with ID "summary" under Messages subcollection
    const loadSummary = async () => {
      try {
        const summaryDoc = await getDoc(doc(db, "profileData", userProfileId, "Chats", chatId, "Messages", "summary"));
        if (summaryDoc.exists()) {
          setSummary(summaryDoc.data().summary || "");
        } else {
          setSummary("");
        }
      } catch (error) {
        console.error("Failed to load chat summary:", error);
        setSummary("");
      }
    };

    loadSummary();

    return () => unsub();
  }, [userProfileId, chatId]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 40);
    }
  }, [messages]);

  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => {
      const v = synthRef.current.getVoices() || [];
      setVoices(v);
    };
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
    return () => {
      if (synthRef.current) synthRef.current.onvoiceschanged = null;
    };
  }, []);

  // TTS helpers
  const speakText = (text, opts = {}) => {
    if (isMuted) return;
    if (!synthRef.current || !text) return;
    if (synthRef.current.speaking) {
      try { synthRef.current.cancel(); } catch (e) {}
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    const utter = new SpeechSynthesisUtterance(text);
    currentUtterRef.current = utter;
    const female = voices.find((v) =>
      /female|zira|google uk english female/i.test(v.name)
    );
    if (opts.voiceName) {
      const v = voices.find((v) => v.name.includes(opts.voiceName));
      if (v) utter.voice = v;
    } else if (female) {
      utter.voice = female;
    }
    utter.lang = opts.lang || "en-US";
    utter.rate = opts.rate ?? 1;
    utter.pitch = opts.pitch ?? 1;
    utter.volume = opts.volume ?? 1;
    utter.onstart = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsSpeaking(true);
      setGifKey((k) => k + 1);
    };
    utter.onend = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        currentUtterRef.current = null;
        fadeTimeoutRef.current = null;
      }, GIF_FADE_MS);
    };
    utter.onerror = () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
      fadeTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        currentUtterRef.current = null;
        fadeTimeoutRef.current = null;
      }, GIF_FADE_MS);
    };
    try {
      synthRef.current.speak(utter);
    } catch (err) {
      console.error("TTS speak error", err);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsSpeaking(false);
      currentUtterRef.current = null;
    }
  };

  const stopSpeaking = () => {
    if (!synthRef.current) return;
    try { synthRef.current.cancel(); } catch (e) {}
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    setIsSpeaking(false);
    currentUtterRef.current = null;
  };

  const toggleMute = () => {
    setIsMuted((m) => {
      if (!m) stopSpeaking();
      return !m;
    });
  };

  // End chat, mark ended, then create new chat session
  const handleEndChat = async () => {
    if (!chatId || !userProfileId) return;
    try {
      const chatRefObj = doc(db, "profileData", userProfileId, "Chats", chatId);
      await updateDoc(chatRefObj, {
        ended: true,
        endedAt: serverTimestamp(),
      });

      // Don't erase summary; keep historical record

      const now = new Date();
      const newSessionId = getSessionId(now);
      const newChatRef = doc(db, "profileData", userProfileId, "Chats", newSessionId);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        ended: false,
        title: `Chat on ${now.toLocaleString()}`,
      });

      setChatId(newSessionId);
      setMessages([{ id: "init-bot-msg", role: "assistant", content: "Hello! I'm Alpha, your AI assistant. How can I help you?" }]);
      setSummary("");
    } catch (error) {
      console.error("Error ending chat:", error);
      alert("Failed to end chat. Try again.");
    }
  };

  // Manually start new chat
  const handleNewChat = async () => {
    if (!userProfileId) return;
    try {
      const now = new Date();
      const sessionId = getSessionId(now);
      const chatRefObj = doc(db, "profileData", userProfileId, "Chats", sessionId);
      await setDoc(chatRefObj, {
        createdAt: serverTimestamp(),
        ended: false,
        title: `Chat on ${now.toLocaleString()}`,
      });
      setChatId(sessionId);
      setMessages([{ id: "init-bot-msg", role: "assistant", content: "Hello! I'm Alpha, your AI assistant. How can I help you?" }]);
      setSummary("");
    } catch (error) {
      console.error("Error starting new chat:", error);
      alert("Failed to start new chat.");
    }
  };

  // Navigate to chat topic/session
  const goToTopic = (id) => setChatId(id);

  // Delete entire chat session and messages
  const handleDeleteChat = async (deleteChatId) => {
    if (!deleteChatId || !userProfileId) return;
    const confirmDelete = confirm("Are you sure you want to delete this chat? This action cannot be undone.");
    if (!confirmDelete) return;
    try {
      const chatRefObj = doc(db, "profileData", userProfileId, "Chats", deleteChatId);
      const messagesRef = collection(db, "profileData", userProfileId, "Chats", deleteChatId, "Messages");
      const messagesSnap = await getDocs(messagesRef);

      const batch = writeBatch(db);
      messagesSnap.forEach((msgDoc) => {
        batch.delete(msgDoc.ref);
      });
      await batch.commit();

      // Delete summary document if exists
      const summaryDocRef = doc(db, "profileData", userProfileId, "Chats", deleteChatId, "Messages", "summary");
      await deleteDoc(summaryDocRef).catch(() => {});

      await deleteDoc(chatRefObj);

      if (chatId === deleteChatId) {
        setChatId(null);
        setMessages([{ id: "init-bot-msg", role: "assistant", content: "Hello! I'm Alpha, your AI assistant. How can I help you?" }]);
        setSummary("");
      }
    } catch (error) {
      console.error("handleDeleteChat error:", error);
      alert("Error deleting chat. Try again.");
    }
  };

  // Helper: Get text version of messages history
  const messagesToText = (msgs) => {
    return msgs.map(m => `${m.role === "user" ? "user" : "assistant"}: ${m.content}`).join("\n");
  };

  // Send message & handle AI response with RAG buffer + summarizer
  const handleSend = async () => {
    if (!input.trim() || !userProfileId || activeChatEnded) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: "user", content: userMsg }]);
    setInput("");

    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        const now = new Date();
        const sessionId = getSessionId(now);
        const chatRefObj = doc(db, "profileData", userProfileId, "Chats", sessionId);
        await setDoc(chatRefObj, {
          createdAt: serverTimestamp(),
          ended: false,
          title: `Chat on ${now.toLocaleString()}`,
        }, { merge: true });
        activeChatId = sessionId;
        setChatId(activeChatId);
      }

      const messagesRef = collection(db, "profileData", userProfileId, "Chats", activeChatId, "Messages");
      const now = new Date();
      const msgTime = formatTimeKey(now);

      await setDoc(doc(messagesRef, msgTime), {
        role: "user",
        content: userMsg,
        timestamp: serverTimestamp(),
      });

      const botMsgTime = formatTimeKey(new Date(Date.now() + 1000));
      const processingRef = doc(messagesRef, botMsgTime);
      await setDoc(processingRef, {
        role: "assistant",
        content: "⏳ Processing...",
        timestamp: serverTimestamp(),
        processing: true,
      });

      // Get all messages for threshold check
      const snapshot = await getDocs(messagesRef);
      const updatedMessages = snapshot.docs
        .filter(d => d.id !== "summary")
        .map(d => ({
          id: d.id,
          ...d.data(),
        }));

      // If exceeding threshold, summarize and save summary doc in Messages subcollection
      if (updatedMessages.length > 50) {
        const text = updatedMessages.map(m => m.content).join(" ");
        const newSummary = await callSummarizeAPI(text, userProfileId, activeChatId);
        setSummary(newSummary);

        const summaryDocRef = doc(messagesRef, "summary");
        await setDoc(summaryDocRef, { summary: newSummary });
      }

      // --- Build context & structured history ---
      const lastFiveMsgs = updatedMessages.slice(-5);
      const context =
        summary && updatedMessages.length > 50
          ? `${summary}\n${messagesToText(lastFiveMsgs)}`
          : messagesToText(updatedMessages);

      const structured = getStructuredHistory(updatedMessages);

      // --- Call model correctly ---
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let answer;
      try {
        const response = await fetch(`${API_URL}/alpha_bot80`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request: userMsg,
            context,
            messages: structured,
            chatId: activeChatId,
            profileId: userProfileId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        answer = data.answer ?? "Sorry, I couldn't generate an answer.";
      } catch (e) {
        console.error("Model call failed:", e);
        answer = "⚠️ An error occurred. Try again!";
      }

      // Keep unified schema when saving bot response
      await setDoc(processingRef, {
        role: "assistant",
        content: answer,
        timestamp: serverTimestamp(),
        processing: false,
      });

      setMessages(prev => [
        ...prev.filter(m => !m.processing),
        { id: `${Date.now()}-bot`, role: "assistant", content: answer }
      ]);

      speakText(answer);
    } catch (error) {
      console.error("handleSend error:", error);
      setMessages(prev => [...prev, { id: `error-bot-${Date.now()}`, role: "assistant", content: "⚠️ An error occurred. Try again!" }]);
      speakText("An error occurred. Try again!");
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-light bg-light fixed-top app-navbar">
        <div className="nav-left">
          <button className="btn menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>☰</button>
          <div className="navbar-brand">AlphaWell</div>
        </div>
        <div className="nav-right">
          <button className="btn btn-outline-primary me-2" onClick={toggleMute}>{isMuted ? "🔇 Unmute" : "🔊 Mute"}</button>
          <Link href="/profile"><img src="https://cdn-icons-png.flaticon.com/512/6522/6522516.png" alt="Profile" width={40} height={40} className="rounded-circle profile-icon" /></Link>
        </div>
      </nav>

      {/* Sidebar */}
      {isSidebarOpen && <div className="sidebar open"><h4>Menu</h4></div>}

      {/* Chatbot */}
      <div className="chatbot-container">
        <div className="ai-avatar">
          <div className="avatar-wrapper" aria-hidden={isSpeaking ? "false" : "true"}>
            <Image
              src="/doc.jpg"
              alt="AI Avatar"
              width={160}
              height={160}
              className="avatar-image"
            />
            {isSpeaking && (
              <Image
                key={gifKey}
                src="/doc.gif"
                alt="AI Speaking Animation"
                width={160}
                height={160}
                className="gif-overlay"
              />
            )}
          </div>
        </div>
        <div className="chat-box">
          <div className="messages" ref={chatRef}>
            {messages.map((msg) => {
              const isProcessing = !!msg.processing;
              return (
                <div
                  key={msg.id}
                  className={`message ${msg.role === "assistant" ? "bot" : "user"}${isProcessing ? " processing" : ""}`}
                >
                  {msg.content}
                </div>
              );
            })}
          </div>
          <div className="input-area">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={activeChatEnded}
              placeholder={activeChatEnded ? "This chat is ended and read-only." : "Type your message..."}
            />
            <button className="send-btn" onClick={handleSend} disabled={activeChatEnded}>Send</button>
            {activeChatEnded && (
              <button className="btn btn-secondary new-chat-btn ms-2" onClick={handleNewChat}>
                New Chat
              </button>
            )}
            {!activeChatEnded && chatId && (
              <button className="btn btn-danger end-chat-btn ms-2" onClick={handleEndChat}>
                End Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat History */}
      <aside className="chat-history-sidebar" aria-label="Chat history topics">
        <h5>Chat History</h5>
        <ul className="chat-history-list">
          {chatTopics.length === 0 ? (
            <li className="no-chats">No chats yet</li>
          ) : (
            chatTopics.map((topic) => (
              <li key={topic.id} className="chat-topic-item">
                <button
                  className="chat-history-btn"
                  onClick={() => goToTopic(topic.id)}
                  aria-label={`Open chat topic: ${topic.title}`}
                  disabled={topic.id === chatId}
                >
                  <span className={`topic-title ${topic.id === chatId ? "active" : ""}`}>
                    {topic.title}
                  </span>
                  {topic.ended && <span className="ended-flag">(Ended)</span>}
                </button>
                <button
                  className="btn btn-sm btn-danger ms-2 delete-chat-btn"
                  onClick={() => handleDeleteChat(topic.id)}
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  🗑️
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>
    </>
  );
}