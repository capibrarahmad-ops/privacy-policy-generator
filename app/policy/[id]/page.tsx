"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { StoredPolicyRecord } from "@/lib/db";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface PageProps {
  params: Promise<{ id: string }>;
}

function PolicyDetailsContent({ policyId }: { policyId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();

  // Route Protection: require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/?redirect=/policy/${policyId}`);
    }
  }, [user, authLoading, router, policyId]);

  const [policyRecord, setPolicyRecord] = useState<StoredPolicyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Markdown Content & Title State
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("Privacy Policy");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // View & Edit mode state
  // Default is 'preview' (showing the complete privacy policy in a professional document layout)
  // 'edit' allows modifying the content
  // 'split' allows side-by-side editing and previewing
  const [isEditing, setIsEditing] = useState(false);
  const [editorLayout, setEditorLayout] = useState<"split" | "editor-only">("split");

  // Copy feedback state
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [showDeploySuccessModal, setShowDeploySuccessModal] = useState(false);
  const [deploymentData, setDeploymentData] = useState<{
    slug: string;
    liveUrl: string;
    fullLiveUrl: string;
    publishedAt: string;
  } | null>(null);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);

  // Fetch policy data on mount
  useEffect(() => {
    let isCurrent = true;

    async function fetchPolicy() {
      setLoading(true);
      setLoadError(null);

      try {
        const userIdParam = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
        const res = await fetch(`/api/policy/${policyId}${userIdParam}`);
        const data = await res.json();

        if (!res.ok || !data.success || !data.policy) {
          throw new Error(data.error || "Failed to load policy record.");
        }

        if (isCurrent) {
          const rec: StoredPolicyRecord = data.policy;

          // Owner verification
          if (rec.userId && user?.id && rec.userId !== user.id) {
            throw new Error("You do not have permission to view or edit this policy draft.");
          }

          setPolicyRecord(rec);
          const initialMd =
            rec.markdownContent ||
            rec.generatedPolicy?.markdown ||
            rec.rawContent ||
            "";
          setMarkdown(initialMd);
          setTitle(rec.title || rec.companyName || "Privacy Policy");
        }
      } catch (err: any) {
        console.error("Error loading policy:", err);
        if (isCurrent) setLoadError(err?.message || "Failed to load policy.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    if (policyId && !authLoading) {
      fetchPolicy();
    }

    return () => {
      isCurrent = false;
    };
  }, [policyId, user?.id, authLoading]);

  // Handle Save Draft (manual save)
  const handleSaveDraft = async () => {
    if (!policyRecord) return;
    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch(`/api/policy/${policyRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown,
          title,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save policy updates.");
      }

      setPolicyRecord(data.policy);
      setSaveSuccessMsg("Policy content saved successfully!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || "Failed to save updates.");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyStatus("success");
      setTimeout(() => setCopyStatus("idle"), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  // Download .md file
  const handleDownloadMarkdown = () => {
    const slugName = policyRecord?.slug || "privacy-policy";
    const filename = `${slugName}.md`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Deploy Policy to live public URL
  const handleDeploy = async () => {
    if (!policyRecord) return;
    setIsDeploying(true);
    setDeployError(null);

    try {
      const res = await fetch(`/api/policy/${policyRecord.id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown,
          title,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Deployment failed. Please try again.");
      }

      // Deployment confirmed and verified retrievable
      setDeploymentData({
        slug: data.slug,
        liveUrl: data.liveUrl,
        fullLiveUrl: data.fullLiveUrl,
        publishedAt: data.publishedAt,
      });

      setPolicyRecord((prev) =>
        prev
          ? {
              ...prev,
              isPublished: true,
              publishedAt: data.publishedAt,
              markdownContent: markdown,
            }
          : null
      );

      setShowDeploySuccessModal(true);
    } catch (err: any) {
      console.error("Deploy error:", err);
      setDeployError(err?.message || "Failed to deploy policy. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const copyLiveUrlToClipboard = async () => {
    if (!deploymentData) return;
    try {
      await navigator.clipboard.writeText(deploymentData.fullLiveUrl);
      setCopiedLiveUrl(true);
      setTimeout(() => setCopiedLiveUrl(false), 2500);
    } catch (err) {
      console.error("Failed to copy live url:", err);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Policy</h2>
          <p className="text-slate-600 text-sm mb-6">{loadError || "Policy could not be found."}</p>
          <Link
            href="/create"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition"
          >
            &larr; Back to Create Policy
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/create"
              className="flex items-center gap-2 group transition"
              id="brand-header-link"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  className="w-4 h-4"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Privacy<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-xs">
                {title}
              </span>
              {policyRecord.isPublished ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Published &bull; Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Private Draft
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <span className="hidden md:inline-block text-xs font-medium text-slate-500 truncate max-w-[160px]">
                {user.email}
              </span>
            )}
            <button
              onClick={() => signOut()}
              className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Action Bar with Required Buttons: Edit, Copy Markdown, Download .md, Deploy */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left Buttons: Navigation & Edit Mode Toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/create"
              id="back-to-input-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
              title="Return to input page"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Link>

            {/* Prominent "Edit" Button */}
            <button
              type="button"
              id="edit-btn"
              onClick={() => setIsEditing(!isEditing)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer ${
                isEditing
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title="Edit privacy policy content and Markdown"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>{isEditing ? "View Document" : "Edit"}</span>
            </button>

            {/* Layout switch when editing */}
            {isEditing && (
              <div className="hidden sm:inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-100 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditorLayout("split")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    editorLayout === "split"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  type="button"
                  onClick={() => setEditorLayout("editor-only")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    editorLayout === "editor-only"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Editor Only
                </button>
              </div>
            )}
          </div>

          {/* Right Action Buttons: Copy Markdown, Download .md, Save Draft, Deploy */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Copy Markdown Button */}
            <button
              type="button"
              id="copy-markdown-btn"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
              title="Copy Markdown source to clipboard"
            >
              {copyStatus === "success" ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : copyStatus === "error" ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-red-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  <span className="text-red-700">Failed to copy</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-slate-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            {/* Download .md Button */}
            <button
              type="button"
              id="download-md-btn"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs cursor-pointer"
              title="Download Markdown as .md file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Download .md</span>
            </button>

            {/* Save Changes (visible in edit mode) */}
            {isEditing && (
              <button
                type="button"
                id="save-draft-btn"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs cursor-pointer disabled:opacity-50"
                title="Save markdown edits as private draft"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-slate-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            )}

            {/* Prominent Deploy Button */}
            <button
              type="button"
              id="deploy-btn"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeploying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                  </svg>
                  <span>Deploy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
        {saveSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
            </svg>
            <span>{saveErrorMsg}</span>
          </div>
        )}

        {deployError && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
            </svg>
            <div>
              <strong className="font-semibold block mb-0.5">Deployment Failed</strong>
              <span>{deployError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Document Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* If editing is active, show the interactive editor */}
        {isEditing ? (
          <div
            className={`grid gap-6 ${
              editorLayout === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Editor Pane */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Edit Markdown Source
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {wordCount} words &bull; {charCount} chars
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <textarea
                  id="markdown-source-editor"
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={26}
                  className="w-full flex-1 p-4 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-y leading-relaxed"
                  placeholder="Edit your policy content..."
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  Modifications update the rendered layout immediately. Click &ldquo;Save Changes&rdquo; or &ldquo;Deploy&rdquo; when ready.
                </p>
              </div>
            </div>

            {/* Split Rendered Preview Pane */}
            {editorLayout === "split" && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      Live Rendered Preview
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Automatic Sync</span>
                </div>

                <div className="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[800px]">
                  <article className="prose prose-slate max-w-none">
                    <MarkdownRenderer content={markdown} />
                  </article>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Professional Document Preview Layout */
          <div className="max-w-4xl mx-auto">
            <article
              id="professional-policy-document"
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 md:p-14 text-slate-800 leading-relaxed font-sans"
            >
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-7 mb-8 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {policyRecord.isPublished ? "Official Published Document" : "Formatted Document Draft"}
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    {wordCount} words &bull; ~{Math.max(1, Math.ceil(wordCount / 200))} min read
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                  {title}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
                  <div>
                    <span className="text-slate-400">Status:</span>{" "}
                    <span className={policyRecord.isPublished ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {policyRecord.isPublished ? "Live & Published" : "Private Draft"}
                    </span>
                  </div>
                  <div>&bull;</div>
                  <div>
                    <span className="text-slate-400">Created:</span>{" "}
                    <span className="text-slate-700">
                      {new Date(policyRecord.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div>&bull;</div>
                  <div>
                    <span className="text-slate-400">Format:</span>{" "}
                    <span className="text-slate-700 font-mono">Clean Markdown (.md)</span>
                  </div>
                </div>
              </div>

              {/* Rendered Document Body */}
              <div className="space-y-6">
                <MarkdownRenderer content={markdown} stripFirstHeading={true} />
              </div>

              {/* Document Footer */}
              <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span>
                  Maintained and formatted by {title}.
                </span>
                <span className="text-slate-400">
                  Powered by PrivacyFlow
                </span>
              </div>
            </article>
          </div>
        )}
      </main>

      {/* Deployment Success Modal */}
      {showDeploySuccessModal && deploymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
              Privacy Policy Published!
            </h3>
            <p className="text-slate-600 text-sm text-center mb-6 leading-relaxed">
              Your privacy policy is now live at its permanent public URL. It has been verified and is publicly accessible.
            </p>

            {/* Public Live URL Box */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Public Live URL
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={deploymentData.fullLiveUrl}
                  className="bg-transparent text-xs sm:text-sm font-mono text-slate-800 flex-1 outline-none truncate"
                />
                <button
                  type="button"
                  id="copy-live-url-btn"
                  onClick={copyLiveUrlToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition cursor-pointer"
                >
                  {copiedLiveUrl ? "Copied!" : "Copy URL"}
                </button>
              </div>
            </div>

            {/* Honest Hosting / Subdomain Notice */}
            <div className="mb-6 p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-blue-700 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Hosting &amp; Custom Domain Information
              </div>
              <p>
                This policy is hosted and served live directly by your PrivacyFlow application at <span className="font-mono font-semibold">{deploymentData.liveUrl}</span>.
              </p>
              <p className="mt-1 text-blue-800">
                If you wish to host it under your own custom domain or subdomain (such as <span className="font-mono">privacy.yourdomain.com</span>), configure a CNAME record or reverse proxy to point to this deployment, or link directly to this stable URL from your app or App Store listing.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href={deploymentData.liveUrl}
                target="_blank"
                id="view-live-policy-link"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <span>View Live Policy</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => setShowDeploySuccessModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PolicyDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PolicyDetailsContent policyId={unwrappedParams.id} />
    </Suspense>
  );
}
