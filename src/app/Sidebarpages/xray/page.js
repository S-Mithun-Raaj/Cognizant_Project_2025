"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import "./xray.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      text: " Upload your X-ray image and discover the invisible! ✨",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      e.target.value = "";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    // 1) Echo user text
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, sender: "user" }]);
      setInput("");
    }
    // 2) Echo file upload note
    if (selectedFile) {
      setMessages((prev) => [
        ...prev,
        { text: `ᵔ ᵕ ᵔ File uploaded: ${fileName}`, sender: "user" },
      ]);
    }

    setLoading(true);
    // 3) Show “Analyzing…”
    setMessages((prev) => [
      ...prev,
      { text: "Analyzing… Please wait.", sender: "bot" },
    ]);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(
        "https://a96e2ef30160.ngrok-free.app/predict/",
        {
          method: "POST",
          body: formData,
        }
      );

      // 4) If not OK, try to parse JSON for error/message
      if (!response.ok) {
        let errText = `Error ${response.status}`;
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const errJson = await response.json();
          errText = errJson.error || errJson.message || errText;
        }
        throw new Error(errText);
      }

      const contentType = response.headers.get("content-type") || "";

      // 4a) JSON response → show bot message
      if (contentType.includes("application/json")) {
        const data = await response.json();
        const msg = data.message || data.error || "No response.";
        setMessages((prev) => [
          ...prev.slice(0, -1), // remove “Analyzing…”
          { text: msg, sender: "bot" },
        ]);

      // 4b) Image blob → show annotated X-ray
      } else if (contentType.includes("image/")) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { text: "Got it! Here’s your processed X-ray:", sender: "bot" },
          { image: url, sender: "bot" },
        ]);

      } else {
        throw new Error("Unsupported response type: " + contentType);
      }
    } catch (err) {
      console.error("Error processing:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { text: `Error: ${err.message}`, sender: "bot" },
      ]);
    } finally {
      setLoading(false);
      setSelectedFile(null);
      setFileName("");
    }
  };

  return (
    <div className="cb-container">
      <h1 className="cb-title"> Upload Your X-ray</h1>
      <div className="cb-box">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            className={`cb-message ${
              msg.sender === "user" ? "cb-message-user" : "cb-message-bot"
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {msg.text && <p>{msg.text}</p>}
            {msg.image && (
              <div className="cb-img-container">
                <img src={msg.image} alt="Processed X-ray" className="cb-img" />
                <a
                  href={msg.image}
                  download="processed_xray.jpg"
                  className="cb-download-btn"
                >
                  💾 Download Image
                </a>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="cb-input-row">
        <label htmlFor="file-upload" className="cb-file-label">
          🗁 Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          className="cb-file-upload"
          onChange={handleFileChange}
          disabled={loading}
        />

        {fileName && <span className="cb-file-name">🗀 {fileName}</span>}

        <button
          className="cb-send-btn"
          onClick={sendMessage}
          disabled={loading}
        >
          {loading ? "⏱ Sending..." : "Send ⌯⌲"}
        </button>
      </div>
    </div>
  );
}
