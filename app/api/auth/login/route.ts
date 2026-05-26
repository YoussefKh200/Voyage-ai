import { NextResponse } from "next/server";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth/crypto";
import { findUserByEmail } from "@/lib/auth/storage";

function validateEmail(email: unknown) {
  return typeof email === "string" && email.includes("@") && email.trim().length > 5;
}

function validatePassword(password: unknown) {
  return typeof password === "string" && password.length >= 8;
}

export async function POST(req: Request) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!validateEmail(email) || !validatePassword(password)) {
    return NextResponse.json({ success: false, error: "Enter a valid email and password." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
  }

  const token = createSessionToken(user.email);
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
