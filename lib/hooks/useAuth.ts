"use client";

import { useEffect, useState } from "react";

export interface AuthSession {
  email: string;
}

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setSession(data.session);
      } catch {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setSession(null);
    window.location.href = "/";
  };

  return { session, loading, logout };
}
