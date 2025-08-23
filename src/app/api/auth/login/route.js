// src/app/api/auth/login/route.js
import admin from "@/app/lib/firebaseAdmin";
import { NextResponse } from "next/server";


export async function POST(request) {
  try {
    const { token } = await request.json();

    // 1. Verify the ID token using Firebase Admin
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
    }

    // 2. Create a session cookie with a custom expiration (e.g., 7 days)
    const expiresIn = 1000 * 60 * 60 * 24 * 7; // 7 days
    const sessionCookie = await admin.auth().createSessionCookie(token, {
      expiresIn,
    });

    // 3. Set the cookie in the response
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: expiresIn / 1000, // in seconds
    });

    return response;
  } catch (error) {
    console.error("Error in /api/auth/login:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
