"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/create";
  const verifiedNotice = searchParams.get("verified");

  const { user, isLoading, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already authenticated, redirect to generator
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirectTarget);
    }
  }, [user, isLoading, redirectTarget, router]);

  const validate = (): boolean => {
    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setFormError("Please enter your password.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error, session } = await signIn(email.trim(), password, rememberMe);

      if (error) {
        const errorMsg = error.message?.toLowerCase() || "";
        const errorStatus = (error as any).status;

        if (errorMsg.includes("invalid login credentials")) {
          setFormError("Invalid email or password. Please check your credentials or create an account.");
        } else if (errorMsg.includes("email not confirmed")) {
          setFormError(
            "Your email address has not been confirmed yet. Please check your inbox for the verification link, or disable email confirmation in Supabase."
          );
        } else if (errorStatus === 429 || errorMsg.includes("rate limit") || errorMsg.includes("too many requests")) {
          setFormError("Too many login attempts. Please wait a moment before trying again.");
        } else if (
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("network") ||
          (error as any).name === "AuthRetryableFetchError"
        ) {
          setFormError(
            "Cannot connect to Supabase database (ERR_NAME_NOT_RESOLVED / Failed to fetch). Your Supabase project is likely PAUSED due to inactivity or the project domain has changed. Please check your Supabase Dashboard to unpause it, or update .env.local."
          );
        } else {
          setFormError(error.message || "Sign in failed. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      if (session) {
        router.replace(redirectTarget);
      }
    } catch (err: any) {
      console.error("Login unexpected error:", err);
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("failed to fetch") || msg.includes("network")) {
        setFormError(
          "Cannot connect to Supabase (Failed to fetch). Your Supabase project is likely paused in your dashboard, or the URL in .env.local is unreachable."
        );
      } else {
        setFormError(err?.message || "An unexpected error occurred. Please check network connection.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-8 sm:py-12">
        {/* Brand Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group transition"
            id="brand-logo-link"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                className="w-5 h-5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Privacy<span className="text-blue-600">Flow</span>
            </span>
          </Link>
        </header>

        {/* Center: Auth Form Container */}
        <main className="my-auto py-8 sm:py-10 max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Sign in to create and manage your privacy policies
            </p>
          </div>

          {verifiedNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Email confirmed! You can now sign in to your PrivacyFlow account.</span>
            </div>
          )}

          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="leading-snug">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  id="forgot-password-link"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                  required
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me-checkbox"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="signin-submit-btn"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-150 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-xs sm:text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              id="signup-link"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
            >
              Sign Up
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-xs text-slate-400 text-center sm:text-left">
          &copy; {new Date().getFullYear()} PrivacyFlow Inc. All rights reserved.
        </footer>
      </div>

      {/* Right Column: Side Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Subtle decorative background glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Tagline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Modern Privacy Governance
          </div>
        </div>

        {/* Center Panel Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Privacy made simple.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Create, manage, and publish legally compliant privacy policies for websites, mobile apps, and SaaS platforms in minutes.
          </p>

          {/* Value Proposition Cards */}
          <div className="space-y-3.5 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Plain English Generator</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Describe what your app does and we automatically structure complete legal clauses.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Hosted Public URLs</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Instant public link (<code className="text-blue-300">/p/your-app</code>) ready for App Store and Google Play reviews.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Zero Guesswork</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Missing information is clearly flagged [Needs Confirmation] so nothing is mistakenly assumed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Trusted by modern developers &amp; founders</span>
          <span>Web &bull; iOS &bull; Android</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
