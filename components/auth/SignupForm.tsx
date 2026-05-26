"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok || !payload.success) {
      setError(payload.error || "Unable to create your account. Please try again.");
      return;
    }

    router.push("/planner");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="group">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4a853] mb-2.5">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-[#d4a853]/50 focus:ring-2 focus:ring-[#d4a853]/20 focus:bg-white/5"
          placeholder="you@example.com"
        />
      </div>

      <div className="group">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#d4a853] mb-2.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-[#d4a853]/50 focus:ring-2 focus:ring-[#d4a853]/20 focus:bg-white/5"
          placeholder="••••••••"
        />
        <p className="mt-2 text-xs text-white/40">Min. 8 characters for security</p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-gradient-to-r from-[#d4a853] to-[#e2714b] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-[#d4a853]/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating account
          </span>
        ) : (
          "Create account"
        )}
      </button>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-xs text-blue-200">
        🔒 Your data is encrypted and secure. We never share your information.
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#05040b] px-3 text-white/50">Already have an account?</span>
        </div>
      </div>

      <Link
        href="/login"
        className="w-full rounded-2xl border-2 border-white/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white text-center transition-all duration-300 hover:bg-white/5 hover:border-[#d4a853]/30"
      >
        Sign in
      </Link>
    </form>
  );
}
