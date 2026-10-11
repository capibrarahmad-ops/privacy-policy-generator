"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { GeneratedPolicy } from "@/lib/generatePrivacyPolicy";
import { StoredPolicyRecord } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

function PolicyDetailsContent({ policyId }: { policyId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/?redirect=/policy/${policyId}`);
    }
  }, [user, authLoading, router, policyId]);

  const [policyRecord, setPolicyRecord] = useState<StoredPolicyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedWebsiteUrl, setEditedWebsiteUrl] = useState("");
  const [editedContactEmail, setEditedContactEmail] = useState("");
  const [editedCountry, setEditedCountry] = useState("");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);
  const [deploymentData, setDeploymentData] = useState<{
    slug: string;
    liveUrl: string;
    fullLiveUrl: string;
  } | null>(null);

  // Fetch policy data on mount
  useEffect(() => {
    let isCurrent = true;

    async function fetchPolicy() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/policy/${policyId}`);
        const data = await res.json();

        if (!res.ok || !data.success || !data.policy) {
          throw new Error(data.error || "Failed to load policy record.");
        }

        if (isCurrent) {
          const rec: StoredPolicyRecord = data.policy;
          setPolicyRecord(rec);
          setEditedCompanyName(rec.companyName || "");
          setEditedWebsiteUrl(rec.websiteUrl || "");
          setEditedContactEmail(rec.contactEmail || "");
          setEditedCountry(rec.country || "");
          setEditedMarkdown(rec.generatedPolicy?.markdown || "");
        }
      } catch (err: any) {
        console.error("Error loading policy:", err);
        if (isCurrent) setLoadError(err?.message || "Failed to load policy.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    if (policyId) {
      fetchPolicy();
    }

    return () => {
      isCurrent = false;
    };
  }, [policyId]);

  // Handle Save Edits
  const handleSaveEdits = async () => {
    if (!policyRecord) return;
    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch(`/api/policy/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: editedCompanyName.trim(),
          websiteUrl: editedWebsiteUrl.trim(),
          contactEmail: editedContactEmail.trim(),
          country: editedCountry.trim(),
          markdown: editedMarkdown,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save changes.");
      }

      setPolicyRecord(data.policy);
      setIsEditing(false);
      setSaveSuccessMsg("Policy updated successfully and saved to database.");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveErrorMsg(err?.message || "Failed to save edits.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Copy to Clipboard
  const handleCopy = async (type: "markdown" | "plain") => {
    if (!policyRecord) return;
    const textToCopy =
      type === "markdown"
        ? policyRecord.generatedPolicy.markdown
        : policyRecord.generatedPolicy.plainText;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Handle Deploy / Publish
  const handleDeploy = async () => {
    if (!policyRecord) return;
    setIsDeploying(true);
    setDeployError(null);

    try {
      const res = await fetch(`/api/policy/${policyId}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Deployment failed.");
      }

      // Verify that the public policy page is reachable
      try {
        const verifyRes = await fetch(data.liveUrl, { cache: "no-store" });
        if (!verifyRes.ok && verifyRes.status !== 404) {
          console.warn("Public verification note:", verifyRes.status);
        }
      } catch (verifyErr) {
        console.warn("Public endpoint check warning:", verifyErr);
      }

      setPolicyRecord((prev) =>
        prev
          ? {
              ...prev,
              isPublished: true,
              publishedAt: data.publishedAt,
              slug: data.slug,
            }
          : prev
      );

      setDeploymentData({
        slug: data.slug,
        liveUrl: data.liveUrl,
        fullLiveUrl: data.fullLiveUrl,
      });

      setShowDeploySuccessModal(true);
    } catch (err: any) {
      console.error("Deploy error:", err);
      setDeployError(err?.message || "Failed to publish policy. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading privacy policy...</p>
        </div>
      </div>
    );
  }

  if (loadError || !policyRecord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Policy Not Found</h1>
        <p className="text-slate-600 text-sm max-w-md mb-6">
          {loadError || "The requested policy could not be found or you may not have access."}
        </p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
        >
          &larr; Return to Generator
        </Link>
      </div>
    );
  }

  const { generatedPolicy } = policyRecord;
  const isPublished = Boolean(policyRecord.isPublished);

  // Count Needs Confirmation
  const needsConfirmationCount =
    (generatedPolicy.plainText.match(/\[[^\]]*Needs Confirmation[^\]]*\]/gi) || []).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
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

            <span className="hidden md:inline text-slate-300">/</span>

            <span className="hidden md:inline text-xs font-semibold text-slate-500 max-w-[200px] truncate">
              {policyRecord.companyName || "Policy Document"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              id="back-to-generator-button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>Back to Generator</span>
            </Link>

            {user && (
              <button
                onClick={() => signOut()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
                title="Sign out"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Status Badges */}
          <div className="flex items-center gap-2.5">
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Published Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Draft (Private)
              </span>
            )}

            {needsConfirmationCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span>{needsConfirmationCount} items need review</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy Button */}
            <div className="relative inline-flex rounded-xl shadow-xs">
              <button
                onClick={() => handleCopy("markdown")}
                id="copy-markdown-button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-l-xl border border-r-0 border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                title="Copy policy markdown"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>{copiedType === "markdown" ? "Copied!" : "Copy Markdown"}</span>
              </button>
              <button
                onClick={() => handleCopy("plain")}
                id="copy-plain-button"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-r-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                title="Copy plain text"
              >
                <span>{copiedType === "plain" ? "Copied!" : "Plain Text"}</span>
              </button>
            </div>

            {/* Edit Policy Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              id="edit-policy-button"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                isEditing
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <span>{isEditing ? "Editing..." : "Edit Policy"}</span>
            </button>

            {/* Deploy / Publish Button */}
            <button
              onClick={handleDeploy}
              id="deploy-policy-button"
              disabled={isDeploying}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/20 active:scale-[0.99] transition disabled:opacity-60 cursor-pointer"
            >
              {isDeploying ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="m12 12 4 4m0 0-4 4m4-4H8" />
                  </svg>
                  <span>{isPublished ? "Re-Deploy Policy" : "Deploy"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-center text-xs font-semibold text-emerald-800">
          ✓ {saveSuccessMsg}
        </div>
      )}
      {deployError && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-center text-xs font-semibold text-rose-800">
          ✕ {deployError}
        </div>
      )}

      {/* Main Document Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* EDIT FORM (When Edit Policy is active) */}
        {isEditing && (
          <div className="mb-8 bg-white rounded-2xl border border-blue-200 shadow-md p-6 sm:p-8 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Policy Content</h2>
                <p className="text-xs text-slate-500">
                  Update your company details and customize markdown clauses before deploying.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ Cancel
              </button>
            </div>

            {saveErrorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {saveErrorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Company / App Name
                </label>
                <input
                  type="text"
                  value={editedCompanyName}
                  onChange={(e) => setEditedCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={editedWebsiteUrl}
                  onChange={(e) => setEditedWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Privacy Contact Email
                </label>
                <input
                  type="email"
                  value={editedContactEmail}
                  onChange={(e) => setEditedContactEmail(e.target.value)}
                  placeholder="privacy@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                  Country / Jurisdiction
                </label>
                <input
                  type="text"
                  value={editedCountry}
                  onChange={(e) => setEditedCountry(e.target.value)}
                  placeholder="United States, EU, Worldwide"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase text-slate-700 mb-1">
                Full Markdown Text
              </label>
              <textarea
                rows={12}
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                className="w-full font-mono text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW CARD */}
        <article className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 md:p-14 text-slate-800 font-sans">
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-7 mb-8 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                Privacy Policy Document
              </span>

              {isPublished && (
                <Link
                  href={`/p/${policyRecord.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <span>Open Public Live Page</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Privacy Policy for {policyRecord.companyName}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
              <div>
                <span className="text-slate-400">Website:</span>{" "}
                {policyRecord.websiteUrl && policyRecord.websiteUrl.startsWith("http") ? (
                  <a
                    href={policyRecord.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {policyRecord.websiteUrl}
                  </a>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    {policyRecord.websiteUrl || "Needs Confirmation"}
                  </span>
                )}
              </div>
              <div>&bull;</div>
              <div>
                <span className="text-slate-400">Last Updated:</span> {generatedPolicy.lastUpdated}
              </div>
              <div>&bull;</div>
              <div>
                <span className="text-slate-400">Jurisdiction:</span>{" "}
                {policyRecord.country && !policyRecord.country.includes("Needs Confirmation") ? (
                  policyRecord.country
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Needs Confirmation
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 sm:space-y-10">
            {generatedPolicy.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-16">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-baseline gap-2">
                  <span className="text-blue-600 font-extrabold">{sec.number}.</span>
                  <span>{sec.title}</span>
                </h2>

                <div className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                  {sec.paragraphs.map((p, pIdx) => {
                    if (p.includes("[") && p.includes("]")) {
                      return (
                        <p key={pIdx}>
                          {p.split(/(\[[^\]]+\])/).map((part, idx) =>
                            part.startsWith("[") && part.endsWith("]") && part.includes("Needs Confirmation") ? (
                              <span
                                key={idx}
                                className="inline-flex items-center mx-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                              >
                                {part}
                              </span>
                            ) : (
                              part
                            )
                          )}
                        </p>
                      );
                    }
                    return <p key={pIdx}>{p}</p>;
                  })}

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3 text-slate-700">
                      {sec.bulletPoints.map((bullet, bIdx) => {
                        const isConfirmedTitle = bullet.title && bullet.title.includes("Needs Confirmation");
                        const isConfirmedText = bullet.text && bullet.text.includes("Needs Confirmation");
                        return (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet.title && (
                              <strong
                                className={
                                  isConfirmedTitle
                                    ? "inline-flex items-center mr-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                                    : "text-slate-900 font-semibold"
                                }
                              >
                                {bullet.title}:{" "}
                              </strong>
                            )}
                            {isConfirmedText ? (
                              <span>
                                {bullet.text.split(/(\[[^\]]+\])/).map((part, idx) =>
                                  part.startsWith("[") && part.endsWith("]") && part.includes("Needs Confirmation") ? (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center mx-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300"
                                    >
                                      {part}
                                    </span>
                                  ) : (
                                    part
                                  )
                                )}
                              </span>
                            ) : (
                              bullet.text
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              Policy ID: <code className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{policyRecord.id}</code>
            </span>
            <span>
              Saved & Secured in Supabase Database
            </span>
          </div>
        </article>
      </main>

      {/* DEPLOYMENT SUCCESS MODAL */}
      {showDeploySuccessModal && deploymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              Policy Successfully Deployed!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
              Your privacy policy is now live, permanently hosted, and publicly accessible to your users, app store reviewers, and compliance auditors.
            </p>

            {/* Live URL Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <span className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Public Live URL
              </span>
              <div className="flex items-center justify-between gap-2">
                <a
                  href={deploymentData.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:underline truncate"
                >
                  {deploymentData.fullLiveUrl}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(deploymentData.fullLiveUrl);
                    setCopiedType("deployLink");
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 transition"
                >
                  {copiedType === "deployLink" ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            {/* Embed Code Snippet */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-6">
              <span className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                HTML Embed Snippet (Iframe)
              </span>
              <div className="flex items-center justify-between gap-2">
                <code className="text-[11px] text-slate-600 font-mono truncate">
                  {`<iframe src="${deploymentData.fullLiveUrl}?embed=true" width="100%" height="800"></iframe>`}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<iframe src="${deploymentData.fullLiveUrl}?embed=true" width="100%" height="800" frameborder="0"></iframe>`
                    );
                    setCopiedType("embedCode");
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 transition"
                >
                  {copiedType === "embedCode" ? "Copied!" : "Copy Embed"}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeploySuccessModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <a
                href={deploymentData.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
              >
                <span>View Live Policy</span>
                <span>&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PolicyDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PolicyDetailsContent policyId={resolvedParams.id} />
    </Suspense>
  );
}
