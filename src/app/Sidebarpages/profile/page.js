// pages/profile.js
"use client";

import { useState } from "react";
import './profile.css'
export default function Profile() {
  const [formData, setFormData] = useState({
    avatarUrl: "/images/default-avatar.png",
    name: "John Doe",
    title: "Senior Software Engineer",
    bio: "Write a brief bio about yourself here.",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, avatarUrl: url }));
  };

  const handleReset = () => {
    setFormData({
      avatarUrl: "/images/default-avatar.png",
      name: "John Doe",
      title: "Senior Software Engineer",
      bio: "Write a brief bio about yourself here.",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      website: "https://johndoe.dev",
    });
  };

  return (
    <main className="profile-container">
      <header className="profile-header">
        <div className="profile-image-wrapper">
          <img
            src={formData.avatarUrl}
            alt="Avatar"
            className="profile-image"
          />
        </div>
        <div className="avatar-input">
          <label>
            Avatar URL:
            <input
              type="text"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleAvatarChange}
              className="input-field"
            />
          </label>
        </div>
      </header>

      <section className="profile-form">
        <div className="form-group">
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Title:
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Bio:
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="textarea-field"
              rows={4}
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Phone:
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Location:
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Website:
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="input-field"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleReset} className="btn-reset">
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}
