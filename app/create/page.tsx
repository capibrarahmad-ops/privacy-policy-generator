"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface RecentPolicySummary {
  id: string;
  slug: string;
  title?: string;
  companyName: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

function CreatePolicyContent() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  // Route Protection: redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/?redirect=/create");
    }
  }, [user, isLoading, router]);

  const [rawText, setRawText] = useState("");
  const [isFormatting, setIsFormatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentPolicies, setRecentPolicies] = useState<RecentPolicySummary[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user's previously created policies if logged in
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

  const handleMakeProfessional = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormatting) return;

    const trimmed = rawText.trim();

    // Strict validation
    if (!trimmed) {
      setErrorMessage("Please paste your privacy policy text before formatting.");
      textareaRef.current?.focus();
      return;
    }

    setErrorMessage(null);
    setIsFormatting(true);

    try {
      const response = await fetch("/api/policy/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: trimmed,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to format and save policy. Please try again.");
      }

      // Formatted and persisted successfully! Navigate to the separate preview page
      router.push(`/policy/${data.policyId}`);
    } catch (err: any) {
      console.error("Formatting error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while formatting the policy.");
      setIsFormatting(false);
    }
  };

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const charCount = rawText.length;

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 shadow-xs transition cursor-pointer"
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
        {/* Page Title & Explanation */}
        <div className="text-center sm:text-left mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Professional Document Formatting &bull; Zero AI Alteration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Publish Your Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Paste your privacy policy below. PrivacyFlow transforms your text into a polished, professional document with clean Markdown structure, consistent headings, and neat lists without altering your words, legal statements, or meaning.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10 mb-8 transition-shadow hover:shadow-md">
          <form onSubmit={handleMakeProfessional}>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="privacy-policy-input"
                  className="block text-sm font-bold text-slate-900"
                >
                  Paste Your Privacy Policy
                </label>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-3">
                  <span>{wordCount} words</span>
                  <span>&bull;</span>
                  <span>{charCount} characters</span>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                id="privacy-policy-input"
                name="privacyPolicyInput"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                rows={16}
                placeholder="Paste your complete privacy policy here (including your company name, headings, paragraphs, bullet points, numbered lists, contact details, and dates)..."
                disabled={isFormatting}
                className="w-full rounded-xl border border-slate-300 p-4 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-y leading-relaxed font-mono disabled:opacity-60 disabled:bg-slate-50"
              />
            </div>

            {/* Validation / Error Message */}
            {errorMessage && (
              <div
                id="validation-error-alert"
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <strong className="font-semibold block mb-0.5">Validation Message</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons & Features */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-emerald-600 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Preserves original wording, legal statements, dates, and contact details</span>
              </div>

              {/* Prominent "Make Professional" Button */}
              <button
                type="submit"
                id="make-professional-btn"
                disabled={isFormatting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isFormatting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Formatting Document...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      className="w-4 h-4 group-hover:rotate-12 transition-transform"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                    <span>Make Professional</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User's Saved Policies / Drafts Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              <span>Your Saved Policies &amp; Drafts</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {recentPolicies.length} {recentPolicies.length === 1 ? "policy" : "policies"}
            </span>
          </div>

          {loadingRecent ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading your policies...
            </div>
          ) : recentPolicies.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
              <p>You haven&apos;t created any policies yet.</p>
              <p className="text-slate-400 mt-1">Paste your policy above and click &ldquo;Make Professional&rdquo; to format your first draft.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPolicies.map((pol) => (
                <div
                  key={pol.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg px-2 transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/policy/${pol.id}`}
                        className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition"
                      >
                        {pol.title || pol.companyName || "Privacy Policy"}
                      </Link>
                      {pol.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Slug: /p/{pol.slug}</span>
                      <span>&bull;</span>
                      <span>Created {new Date(pol.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/policy/${pol.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      Preview &amp; Edit &rarr;
                    </Link>
                    {pol.isPublished && (
                      <Link
                        href={`/p/${pol.slug}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                      >
                        View Live &nearr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreatePolicyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <CreatePolicyContent />
    </Suspense>
  );
}
