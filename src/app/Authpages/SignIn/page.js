"use client";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import Image from "next/image"; // Import Next.js Image component
import { useRouter } from "next/navigation"; // Import Next.js router
import { useState } from "react";
import { auth } from "../../firebaseConfig";
import "./signin.css";

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignIn = async () => {
    const { email, password } = formData;
    setError("");

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign In Success:", userCredential.user);

      // Redirect to /GS page after sign in
      router.push("/GS");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google Sign-In Success:", result.user);

      // Redirect to /GS page after Google Sign-In
      router.push("/GS");
    } catch (err) {
      setError("Google Sign-In Failed: " + err.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth, provider);
      console.log("Apple Sign-In Success:", result.user);

      // Redirect to /GS page after Apple Sign-In
      router.push("/GS");
    } catch (err) {
      setError("Apple Sign-In Failed: " + err.message);
    }
  };

  return (
    <div className="screen-1">
      {/* Logo */}
      <Image
        src="/Slogo.png"
        alt="Logo"
        className="logo"
        width={156}
        height={100}
      />

      {/* Email Input */}
      <div className="email">
        <label htmlFor="email">Email</label>
        <div className="sec-2">
          <input
            type="email"
            name="email"
            placeholder="username@gmail.com"
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="password">
        <label htmlFor="password">Password</label>
        <div className="sec-2">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="***********"
            onChange={handleChange}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Sign In Button */}
      <button className="login" onClick={handleSignIn}>
        Sign In
      </button>

      {/* Google Sign-In */}
      <button
        className="google-login"
        id="holo"
        onClick={handleGoogleSignIn}
        style={{ paddingLeft: "5px" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/800px-Google_%22G%22_logo.svg.png"
          width={20}
          height={20}
          alt="Google Sign In"
        />
      </button>

      {/* Apple Sign-In */}
      <button
        className="apple-login"
        id="holo"
        onClick={handleAppleSignIn}
        style={{ paddingLeft: "5px" }}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
          width={20}
          height={20}
          alt="Apple Sign In"
        />
      </button>

      {/* Footer */}
      <div className="footer">
        <span style={{ color: "black" }}>
          Don’t have an account?{" "}
          <a href="/Authpages/SignUp">Sign Up</a>
        </span>
      </div>
    </div>
  );
}
