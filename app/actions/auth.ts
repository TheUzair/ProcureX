"use server";

import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function loginAction(formData: {
  login: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Login failed" }));
    return { error: error.detail || "Invalid credentials" };
  }

  const data = await res.json();

  // Fetch user profile with the token
  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  if (!meRes.ok) {
    return { error: "Failed to fetch user profile" };
  }

  const user = await meRes.json();

  await createSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  redirect("/dashboard");
}

export async function signupAction(formData: {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  mobile?: string;
}) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Registration failed" }));
    return { error: error.detail || "Could not create account" };
  }

  // Auto-login after registration
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: formData.email, password: formData.password }),
  });

  if (!loginRes.ok) {
    redirect("/login");
  }

  const data = await loginRes.json();

  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  if (!meRes.ok) {
    redirect("/login");
  }

  const user = await meRes.json();

  await createSession({
    userId: user.id,
    email: user.email,
    username: user.username,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function forgotPasswordAction(email: string) {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    return { error: error.detail || "Failed to send reset email" };
  }

  return { success: true };
}

export async function resetPasswordAction(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Reset failed" }));
    return { error: error.detail || "Failed to reset password" };
  }

  return { success: true };
}
