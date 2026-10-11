"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface RecentPolicySummary {
  id: string;
  slug: string;
  companyName: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

const SAMPLE_TEMPLATES = [
  {
    title: "Mobile App (iOS & Android)",
    desc: "Photo & social sharing with user accounts",
    text: "PhotoSnap is a mobile photo editing and sharing app for iOS and Android. Users create an account with their email and username, and upload photos. We collect device information and crash diagnostics using Firebase. We use Stripe for in-app photo filter purchases. We use cookies on our web portal for authentication. We do not sell user data. Users can delete their account in settings. For inquiries, email support@photosnap.app.",
  },
  {
    title: "SaaS Platform",
    desc: "Web app with billing and team management",
    text: "TaskFlow is a web application and SaaS platform for project management. We collect user full name, email address, and billing information for paid team subscriptions. We use Google Analytics for website traffic, Stripe for subscription payments, and AWS for hosting. Users can access, export, or delete their tasks at any time. Privacy contact: privacy@taskflow.io.",
  },
  {
    title: "Content & Blog Website",
    desc: "Public blog with analytics and cookies",
    text: "DevNotes is a personal blog and web development tutorial website. We do not require accounts and do not collect personal information. We use basic Google Analytics to track page views and standard session cookies. We do not sell or share any user data. Contact: hello@devnotes.com.",
  },
];

function PolicyGeneratorContent() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  // Route Protection: redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/?redirect=/create");
    }
  }, [user, isLoading, router]);

  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentPolicies, setRecentPolicies] = useState<RecentPolicySummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user's previously generated policies if logged in
  useEffect(() => {
    if (!user?.id) return;
    let isCurrent = true;

    async function fetchUserPolicies() {
      setLoadingRecent(true);
      try {
        const res = await fetch(`/api/policy/user?userId=${encodeURIComponent(user!.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && isCurrent) {
            setRecentPolicies(data.policies || []);
          }
        }
      } catch (err) {
        console.warn("Could not load recent policies:", err);
      } finally {
        if (isCurrent) setLoadingRecent(false);
      }
    }

    fetchUserPolicies();
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const handleApplySample = (text: string) => {
    setDescription(text);
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGenerating) return; // Prevent duplicate submissions

    const trimmed = description.trim();

    if (!trimmed) {
      setErrorMessage("Please enter a description of your app or website.");
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length < 15) {
      setErrorMessage("Please provide a slightly more descriptive summary (at least 15 characters).");
      textareaRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/policy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: trimmed,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate policy. Please try again.");
      }

      // Persisted successfully in Supabase / DB! Navigate to the dynamic policy details page
      router.push(`/policy/${data.policyId}`);
    } catch (err: any) {
      console.error("Policy generation error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while generating the policy.");
      setIsGenerating(false);
    }
  };

  const charCount = description.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Verifying authentication session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/create"
            className="flex items-center gap-2.5 group transition"
            id="brand-header-link"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
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

          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="max-w-[200px] truncate" title={user.email || ""}>
                  {user.email}
                </span>
              </div>
            )}
            <button
              onClick={() => signOut()}
              id="logout-button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 shadow-xs transition"
              title="Sign out of your account"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4 text-slate-500"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title & Intro */}
        <div className="text-center sm:text-left mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Intelligent Compliance Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Create Your Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Describe your app or website in your own words. PrivacyFlow will analyze your data practices, identify privacy requirements, and generate a complete, professional policy document you can review and deploy.
          </p>
        </div>

        {/* Generator Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10 mb-8 transition-shadow hover:shadow-md">
          {/* Sample Preset Pills */}
          <div className="mb-6">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Start with Examples
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_TEMPLATES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySample(sample.text)}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-xs transition group cursor-pointer"
                >
                  <div className="font-semibold text-slate-800 group-hover:text-blue-700 mb-0.5">
                    {sample.title}
                  </div>
                  <div className="text-slate-500 text-[11px] line-clamp-1">
                    {sample.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} noValidate>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="appDescription"
                  className="block text-sm font-bold text-slate-800"
                >
                  Describe your app or website <span className="text-blue-600">*</span>
                </label>
                <div
                  className={`text-xs font-medium ${
                    charCount === 0
                      ? "text-slate-400"
                      : charCount < 15
                      ? "text-amber-600 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  {charCount} characters
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="appDescription"
                  ref={textareaRef}
                  rows={8}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isGenerating}
                  placeholder="Explain what your app does, what information it collects, how information is used, whether it uses cookies or analytics, and which third-party services it uses."
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 placeholder-slate-400 text-sm sm:text-base leading-relaxed transition resize-y min-h-[160px] outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500 leading-normal flex items-start gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>
                  Tip: Include details such as authentication methods, payment processors (e.g. Stripe), analytics (e.g. Google Analytics), database hosting, or your support email address.
                </span>
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                Policies are securely saved to your account and can be reviewed, edited, and published.
              </div>

              <button
                type="submit"
                id="generate-policy-button"
                disabled={isGenerating || !description.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Generating & Saving Policy...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="w-4 h-4"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    <span>Generate Privacy Policy</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User's Previously Generated Policies */}
        {recentPolicies.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Your Policies ({recentPolicies.length})
              </h2>
              <span className="text-xs text-slate-500">Saved to Supabase</span>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPolicies.map((p) => (
                <div
                  key={p.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 rounded-xl px-2.5 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm truncate">
                        {p.companyName || "Untitled Application"}
                      </span>
                      {p.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Updated {new Date(p.updatedAt || p.createdAt).toLocaleDateString()} &bull; Slug: /{p.slug}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/policy/${p.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-xs font-semibold text-slate-700 hover:text-blue-700 transition"
                    >
                      View & Edit &rarr;
                    </Link>
                    {p.isPublished && (
                      <Link
                        href={`/p/${p.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:underline"
                      >
                        Public Link ↗
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PolicyGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PolicyGeneratorContent />
    </Suspense>
  );
}
