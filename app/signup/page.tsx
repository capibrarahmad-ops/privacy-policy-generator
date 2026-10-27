"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

function SignupForm() {
  const router = useRouter();
  const { user, isLoading, signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // If already authenticated, redirect to generator
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/create");
    }
  }, [user, isLoading, router]);

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
      setFormError("Please create a password.");
      return false;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return false;
    }
    if (!agreeTerms) {
      setFormError("Please agree to the Terms of Service.");
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
      const { error, user: createdUser, session } = await signUp(email.trim(), password, {
        full_name: fullName.trim() || undefined,
      });

      if (error) {
        const errorMsg = error.message?.toLowerCase() || "";
        const errorCode = (error as any).code || "";
        const errorStatus = (error as any).status;

        if (errorMsg.includes("user already registered")) {
          setFormError("An account with this email address already exists. Please sign in instead.");
        } else if (
          errorStatus === 429 ||
          errorCode === "over_email_send_rate_limit" ||
          errorMsg.includes("rate limit") ||
          errorMsg.includes("too many requests")
        ) {
          setFormError(
            "Supabase Email Rate Limit Reached (429): Supabase free projects limit verification emails to 3 per hour. To fix this and make signups work smoothly, disable 'Confirm email' in your Supabase Dashboard (Authentication > Providers > Email)."
          );
        } else if (errorMsg.includes("password")) {
          setFormError(error.message);
        } else if (
          errorMsg.includes("failed to fetch") ||
          errorMsg.includes("network") ||
          (error as any).name === "AuthRetryableFetchError"
        ) {
          setFormError(
            "Cannot connect to Supabase database (ERR_NAME_NOT_RESOLVED / Failed to fetch). Your Supabase project is likely PAUSED due to inactivity or the project domain has changed. Please check your Supabase Dashboard to unpause it, or update .env.local."
          );
        } else {
          setFormError(error.message || "Failed to create account. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      // If session is immediately available (auto-confirm enabled), redirect
      if (session) {
        router.replace("/create");
        return;
      }

      // If email verification was sent
      if (createdUser) {
        setSignupSuccess(true);
      }
    } catch (err: any) {
      console.error("Signup unexpected error:", err);
      const msg = err?.message?.toLowerCase() || "";
      if (msg.includes("failed to fetch") || msg.includes("network")) {
        setFormError(
          "Cannot connect to Supabase (Failed to fetch). Your Supabase project is likely paused in your dashboard, or the URL in .env.local is unreachable."
        );
      } else {
        setFormError(err?.message || "An unexpected error occurred during signup.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Left Column: Form */}
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

        {/* Center: Sign Up Form Container */}
        <main className="my-auto py-8 sm:py-10 max-w-md w-full mx-auto">
          {signupSuccess ? (
            <div className="text-center space-y-4 py-6 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Check Your Email
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                We sent a confirmation link to <strong className="text-slate-900">{email}</strong>. Please click the link in your email to verify your account, then sign in.
              </p>
              <div className="pt-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                  Create Your Account
                </h1>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Start generating and publishing compliant privacy policies
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="leading-snug">{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Full Name Field */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Full Name (Optional)
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Password (Min. 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="Create a strong password"
                      className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                      required
                    />
                    <button
                      type="button"
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

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 transition shadow-xs"
                    required
                  />
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      id="agree-terms-checkbox"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the Terms of Service and understand that generated policies should be verified for specific compliance needs.
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="signup-submit-btn"
                  disabled={isSubmitting}
                  className="w-full mt-3 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-150 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              {/* Back to Sign In */}
              <div className="mt-8 text-center text-xs sm:text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/"
                  id="signin-link"
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="text-xs text-slate-400 text-center sm:text-left">
          &copy; {new Date().getFullYear()} PrivacyFlow Inc. All rights reserved.
        </footer>
      </div>

      {/* Right Column: Side Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Join PrivacyFlow
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Privacy made simple.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Protect your users and satisfy app stores without paying thousands in legal retainer fees.
          </p>

          <div className="space-y-3.5 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Always Up-To-Date</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Easily update policies and redeploy to the same permanent URL whenever features change.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Store Guidelines Built-in</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Includes Apple account deletion requirements and Google Play data declarations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Instant setup &bull; No credit card required</span>
          <span>PrivacyFlow Cloud</span>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
