"use client";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup
} from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "../../firebaseConfig";
import "./login.css";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    const { email, password } = formData;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      router.push("/GS"); // Redirect to GS page
    } catch (err) {
      setError("Invalid email or password"); // Custom error message
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google Sign-In Success:", result.user);
      router.push("/GS"); // Redirect to GS page
    } catch (err) {
      setError("Google Sign-In Failed: " + err.message);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth, provider);
      console.log("Apple Sign-In Success:", result.user);
      router.push("/GS"); // Redirect to GS page
    } catch (err) {
      setError("Apple Sign-In Failed: " + err.message);
    }
  };

  return (
    <div className="screen-1">
      {/* Logo */}
      <Image src="/Slogo.png" alt="Logo" className="logo" width={156} height={100} />

      {/* Email Input */}
      <div className="email">
        <label htmlFor="email">Email</label>
        <div className="sec-2">
          <input type="email" name="email" placeholder="Username@gmail.com" onChange={handleChange} />
        </div>
      </div>

      {/* Password Input */}
      <div className="password">
        <label htmlFor="password">Password</label>
        <div className="sec-2">
          <input type="password" name="password" placeholder="***********" onChange={handleChange} />
        </div>
      </div>

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Login Button */}
      <button className="login" onClick={handleLogin}>Login</button>

      {/* Google Sign-In */}
      <button className="google-login" id="holo" onClick={handleGoogleSignIn} style={{ paddingLeft: "5px" }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/800px-Google_%22G%22_logo.svg.png"
          width={20}
          height={20}
          alt="Google Sign In"
        />
      </button>

      {/* Apple Sign-In */}
      <button className="apple-login" id="holo" onClick={handleAppleSignIn} style={{ paddingLeft: "5px" }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
          width={20}
          height={20}
          alt="Apple Sign In"
        />
      </button>

      {/* Footer */}
      <div className="footer">
        <span style={{ color: "black" }}>Don't have an account? <a className="cl" href="/Authpages/SignIn">Sign Up</a></span>
      </div>
    </div>
  );
}
