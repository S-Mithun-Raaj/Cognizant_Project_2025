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
  doc,
} from "firebase/firestore";
import { API_URL } from "../../../GS/config";
import styles from "./UploadPage.module.css";
import { writeBatch } from "firebase/firestore";

export default function UploadPage() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

  // ✅ Load profile info
  useEffect(() => {
    const name = localStorage.getItem("selectedProfileName");
    if (name) setProfileName(name);
    const id = localStorage.getItem("selectedProfileId");
    if (id) setSelectedProfileId(id);

    console.log("📌 Loaded profile:", { name, id });
  }, []);

  const validateFile = (file) => {
    if (!file.type.includes("pdf")) {
      throw new Error(`${file.name} is not a PDF file`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`${file.name} exceeds 10MB limit`);
    }
    return true;
  };

  const handleFiles = (selectedFiles) => {
    try {
      const validFiles = Array.from(selectedFiles).filter((file) => {
        try {
          return validateFile(file);
        } catch (err) {
          alert(err.message);
          return false;
        }
      });
      setFiles((prev) => [...prev, ...validFiles]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
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
    if (files.length === 0) {
      setError("No files selected!");
      return;
    }
    if (!selectedProfileId) {
      setError("No profile selected!");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        validateFile(file); // Revalidate before upload
        formData.append("files", file);
      });
      formData.append("user_id", selectedProfileId);

      const res = await fetch(API_URL+"/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      const data = await res.json();

      // ✅ Correct
      const batch = writeBatch(db);

      const uploadsRef = collection(
        db,
        "profileData",
        selectedProfileId,
        "uploads"
      );

      files.forEach((file, index) => {
        const docRef = doc(uploadsRef);
        batch.set(docRef, {
          fileName: file.name,
          uploadedAt: new Date(),
          fileSize: file.size,
          namespace: data.namespace,
          index_name: data.index_name || selectedProfileId,
          profileName,
        });
        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
      });

      await batch.commit();

      setFiles([]);
      setUploadProgress(100);
      router.push(`/GS?profileId=${selectedProfileId}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
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

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.buttons}>
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || loading}
          className={styles.uploadBtn}
        >
          {loading ? (
            <div className={styles.loaderWrapper}>
              <div className={styles.loader}></div>
              <span>Uploading...</span>
            </div>
          ) : (
            "Upload & Continue"
          )}
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
