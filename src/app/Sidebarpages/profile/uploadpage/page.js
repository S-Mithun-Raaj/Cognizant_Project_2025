"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import styles from "./UploadPage.module.css";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // ✅ Load profile info
  useEffect(() => {
    const name = localStorage.getItem("selectedProfileName");
    if (name) setProfileName(name);
    const id = localStorage.getItem("selectedProfileId");
    if (id) setSelectedProfileId(id);

    console.log("📌 Loaded profile:", { name, id });
  }, []);

  const handleFiles = (selectedFiles) => {
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    if (
      e.type === "dragenter" ||
      e.type === "dragleave" ||
      e.type === "dragover"
    )
      setDragActive(e.type !== "dragleave");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // ✅ Upload PDF(s)
  const handleUpload = async () => {
    if (files.length === 0) return alert("No files selected!");
    if (!selectedProfileId) return alert("❌ No profile selected!");

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file); // same key for multiple files
      });
      formData.append("user_id", selectedProfileId); // backend expects this

      console.log(
        "📂 Uploading PDFs:",
        files.map((f) => f.name),
        "➡ Profile ID:",
        selectedProfileId
      );

      const res = await fetch("your_link/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      // ✅ Save metadata for each uploaded file into Firestore
      const uploadsRef = collection(
        db,
        "profileData",
        selectedProfileId,
        "uploads"
      );
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await addDoc(uploadsRef, {
          fileName: file.name,
          uploadedAt: new Date(),
          namespace: data.namespace,
          index_name: data.index_name || selectedProfileId,
          profileName,
        });

        console.log("✅ Firestore Saved:", {
          profileId: selectedProfileId,
          fileName: file.name,
          namespace: data.namespace,
        });

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      alert("PDF(s) uploaded successfully!");
      setFiles([]);
      setUploadProgress(100);
      router.push(`/GS?profileId=${selectedProfileId}`);
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.message || "Unknown error"));
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Skip button → Fetch latest namespace + resume chat
  const handleSkip = async () => {
    if (!selectedProfileId) return alert("❌ No profile selected!");

    try {
      const uploadsRef = collection(
        db,
        "profileData",
        selectedProfileId,
        "uploads"
      );
      const q = query(uploadsRef, orderBy("uploadedAt", "desc"), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        alert("⚠️ No uploaded PDFs found for this profile!");
        return;
      }

      const latestUpload = snapshot.docs[0].data();
      console.log("📌 Latest upload fetched:", latestUpload);

      const res = await fetch("your_link/setRetriever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace: latestUpload.namespace }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set retriever");

      console.log("✅ Retriever set:", data);

      const chatsRef = collection(
        db,
        "profileData",
        selectedProfileId,
        "chats"
      );
      const chatQuery = query(chatsRef, orderBy("createdAt", "desc"), limit(1));
      const chatSnapshot = await getDocs(chatQuery);

      let chatId;
      if (!chatSnapshot.empty) {
        chatId = chatSnapshot.docs[0].id;
        console.log("📂 Resuming existing chat:", chatId);
      } else {
        const newChatRef = await addDoc(chatsRef, {
          createdAt: new Date(),
          active: true,
          namespace: latestUpload.namespace,
        });
        chatId = newChatRef.id;
        console.log("🆕 New chat created:", chatId);
      }

      alert(`✅ Retriever set. Resuming chat: ${chatId}`);
      router.push(`/GS?profileId=${selectedProfileId}&chatId=${chatId}`);
    } catch (err) {
      console.error(err);
      alert("❌ Skip failed: " + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Upload PDFs for {profileName || "Selected Profile"}
      </h1>

      <div
        className={`${styles.dragArea} ${dragActive ? styles.active : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current.click()}
        style={{ pointerEvents: loading ? "none" : "auto" }}
      >
        {files.length === 0 ? (
          <p className={styles.dragText}>
            Drag & drop PDFs here or click to select
          </p>
        ) : (
          <ul className={styles.fileList}>
            {files.map((file, index) => (
              <li key={index} className={styles.fileItem}>
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className={styles.removeBtn}
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={loading}
        />
      </div>

      {loading && (
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${uploadProgress}%` }}
          />
          <span className={styles.progressText}>{uploadProgress}%</span>
        </div>
      )}

      <div className={styles.buttons}>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className={styles.uploadBtn}
        >
          {loading ? "Uploading..." : "Upload & Continue"}
        </button>

        <button
          onClick={handleSkip}
          disabled={loading}
          className={styles.skipBtn}
        >
          Skip (Use Latest Upload)
        </button>
      </div>
    </div>
  );
}
