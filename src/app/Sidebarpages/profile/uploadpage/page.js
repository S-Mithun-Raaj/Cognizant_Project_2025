"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./UploadPage.module.css";

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [profileName, setProfileName] = useState("");
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Retrieve profile name from localStorage
  useEffect(() => {
    const name = localStorage.getItem("selectedProfileName");
    if (name) setProfileName(name);
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
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("No files selected!");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      // ✅ Replace with your Kaggle API endpoint
      const res = await fetch("https://your-kaggle-url/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("PDFs uploaded successfully!");
        setFiles([]);
        router.push("/GS"); // Navigate to chatbot page
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
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
        onClick={() => fileInputRef.current.click()}
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
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={files.length === 0}
        className={styles.uploadBtn}
      >
        Upload & Continue
      </button>
    </div>
  );
};

export default UploadPage;
