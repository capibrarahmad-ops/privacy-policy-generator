"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PolicyFormData,
  DEFAULT_FORM_DATA,
  generatePrivacyPolicy,
  GeneratedPolicy,
} from "@/lib/generatePrivacyPolicy";

interface DeploymentResult {
  slug: string;
  editToken: string;
  liveUrl: string;
  fullLiveUrl: string;
  isNew: boolean;
}

export default function PreviewPage() {
  const [formData, setFormData] = useState<PolicyFormData>(DEFAULT_FORM_DATA);
  const [isSampleData, setIsSampleData] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "compliance" | "markdown" | "html">("preview");
  const [copied, setCopied] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedEditLink, setCopiedEditLink] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("privacyPolicyData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.companyName) {
          setFormData(parsed);
          setIsSampleData(false);
        } else {
          setIsSampleData(true);
        }
      } else {
        setIsSampleData(true);
      }
    } catch (e) {
      console.error("Failed to read localStorage:", e);
      setIsSampleData(true);
    }
  }, []);

  const policy: GeneratedPolicy = generatePrivacyPolicy(formData);

  const handleCopy = async () => {
    let contentToCopy = policy.plainText;
    if (activeTab === "markdown") contentToCopy = policy.markdown;
    if (activeTab === "html") contentToCopy = policy.html;

    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownload = () => {
    let content = policy.markdown;
    let filename = `${(policy.companyName || "privacy-policy")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-privacy-policy.md`;

    if (activeTab === "html") {
      content = policy.html;
      filename = `${(policy.companyName || "privacy-policy")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}-privacy-policy.html`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setShowDeployModal(true);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          requestedSlug: formData.customSlug,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDeploymentResult({
          slug: data.slug,
          editToken: data.editToken,
          liveUrl: data.liveUrl,
          fullLiveUrl: data.fullLiveUrl,
          isNew: data.isNew,
        });
      } else {
        alert(data.error || "Deployment failed. Please try again.");
        setShowDeployModal(false);
      }
    } catch (err) {
      console.error("Deploy error:", err);
      alert("Error deploying policy. Check network connection.");
      setShowDeployModal(false);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = async (text: string, setter: (val: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="print:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-slate-900 hover:opacity-90 transition"
            id="nav-brand-link"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span>Privacy Policy Generator</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              id="header-edit-btn"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Edit Information</span>
            </Link>

            <button
              type="button"
              id="header-deploy-btn"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 px-4 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{isDeploying ? "Deploying..." : "Deploy Policy"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Sample Data Alert if directly visited */}
        {isSampleData && (
          <div className="print:hidden mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
              <span>
                <strong>Sample Preview:</strong> You are viewing sample data. Fill out the questionnaire to customize with your app details.
              </span>
            </div>
            <Link href="/create" className="font-semibold text-amber-900 underline hover:text-amber-700 shrink-0">
              Go to Policy Form &rarr;
            </Link>
          </div>
        )}

        {/* Page Top Header */}
        <div className="print:hidden text-center sm:text-left pb-6 mb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Production &amp; App Store Ready
          </div>
          <h1 id="page-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Your Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1.5">
            Generated for <strong className="text-slate-900 font-semibold">{policy.companyName}</strong> &middot; Platform: {policy.platform} &middot; Jurisdiction: {policy.country}
          </p>
        </div>

        {/* Format Toolbar & Action Buttons */}
        <div className="print:hidden mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200/90 max-w-fit">
            <button
              type="button"
              id="tab-preview-btn"
              onClick={() => setActiveTab("preview")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "preview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Document View
            </button>
            <button
              type="button"
              id="tab-compliance-btn"
              onClick={() => setActiveTab("compliance")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "compliance" ? "bg-blue-600 text-white shadow-xs" : "text-blue-700 hover:bg-blue-100"
              }`}
            >
              ★ App Store &amp; Play Safety Guide
            </button>
            <button
              type="button"
              id="tab-markdown-btn"
              onClick={() => setActiveTab("markdown")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "markdown" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              id="tab-html-btn"
              onClick={() => setActiveTab("html")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "html" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              HTML Code
            </button>
          </div>

          {/* Quick Actions: Copy, Download, Print */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="copy-policy-btn"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                copied ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="download-policy-btn"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>

            <button
              type="button"
              id="print-policy-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
              title="Print document"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Document Content Sheet */}
        {activeTab === "preview" && (
          <article id="policy-document-sheet" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 md:p-14 text-slate-800 leading-relaxed font-sans">
            {/* Document Header */}
            <div className="border-b border-slate-200 pb-7 mb-8 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Privacy Policy for {policy.companyName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
                <div>
                  <span className="text-slate-400">Platform:</span> <strong className="text-slate-800">{policy.platform}</strong>
                </div>
                <div>&bull;</div>
                <div>
                  <span className="text-slate-400">Website:</span>{" "}
                  <a href={policy.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                    {policy.websiteUrl}
                  </a>
                </div>
                <div>&bull;</div>
                <div>
                  <span className="text-slate-400">Last Updated:</span> {policy.lastUpdated}
                </div>
                <div>&bull;</div>
                <div>
                  <span className="text-slate-400">Jurisdiction:</span> {policy.country}
                </div>
              </div>
            </div>

            {/* Document Sections */}
            <div className="space-y-8 sm:space-y-10">
              {policy.sections.map((sec) => (
                <section key={sec.id} id={sec.id} className="scroll-mt-20">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-baseline gap-2">
                    <span className="text-blue-600 font-extrabold">{sec.number}.</span>
                    <span>{sec.title}</span>
                  </h2>

                  <div className="space-y-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}

                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul className="list-disc pl-5 sm:pl-6 space-y-2 mt-3 text-slate-700">
                        {sec.bulletPoints.map((bullet, bIdx) => (
                          <li key={bIdx} className="leading-relaxed">
                            {bullet.title && <strong className="text-slate-900 font-semibold">{bullet.title}: </strong>}
                            {bullet.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer Disclaimer */}
            <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center sm:text-left">
              This document was generated for {policy.companyName} using the Privacy Policy Generator.
            </div>
          </article>
        )}

        {/* App Store & Google Play Data Safety Compliance Assistant Tab */}
        {activeTab === "compliance" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                Developer Compliance Guide
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">App Store &amp; Google Play Data Safety Declarations</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Copy and paste these exact declarations into App Store Connect and Google Play Console to prevent submission delays or policy rejections.
              </p>
            </div>

            {/* Apple App Store Privacy Nutrition Labels */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  
                </div>
                <h3 className="text-base font-bold text-slate-900">Apple App Store Privacy Nutrition Labels</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Data Category</th>
                      <th className="py-2.5 px-3">Data Types</th>
                      <th className="py-2.5 px-3">Collected?</th>
                      <th className="py-2.5 px-3">Linked to User?</th>
                      <th className="py-2.5 px-3">Used for Tracking?</th>
                      <th className="py-2.5 px-3">App Store Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {policy.appleNutritionLabels.map((item, idx) => (
                      <tr key={idx} className={item.collected ? "bg-white" : "bg-slate-50/60 opacity-60"}>
                        <td className="py-2.5 px-3 font-semibold">{item.category}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.dataTypes.join(", ")}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.collected ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                            {item.collected ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{item.linkedToUser ? "Yes" : "No"}</td>
                        <td className="py-2.5 px-3">
                          <span className={item.usedForTracking ? "text-rose-600 font-bold" : "text-slate-600"}>
                            {item.usedForTracking ? "Yes (ATT Required)" : "No"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{item.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Google Play Data Safety Form */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ▶
                </div>
                <h3 className="text-base font-bold text-slate-900">Google Play Data Safety Form Answers</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Encrypted in Transit:</span>
                  <span className="text-emerald-700 font-semibold">✓ Yes (HTTPS / TLS 1.3 enforced)</span>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Account &amp; Data Deletion URL:</span>
                  <span className="text-blue-600 font-mono break-all">{policy.googlePlayDataSafety.deletionUrl}</span>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Collected Data Types:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {policy.googlePlayDataSafety.collectedData.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Shared Data Types:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    {policy.googlePlayDataSafety.sharedData.length > 0 ? (
                      policy.googlePlayDataSafety.sharedData.map((d, i) => <li key={i}>{d}</li>)
                    ) : (
                      <li>No data shared with third-party advertisers or brokers.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Markdown Source Tab */}
        {activeTab === "markdown" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 sm:p-8 overflow-hidden text-slate-100 font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-slate-400">
              <span>Markdown Source</span>
              <span>UTF-8</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{policy.markdown}</pre>
          </div>
        )}

        {/* HTML Embed Code Tab */}
        {activeTab === "html" && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 sm:p-8 overflow-hidden text-slate-100 font-mono text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-slate-400">
              <span>HTML Embed Code</span>
              <span>Ready to paste</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">{policy.html}</pre>
          </div>
        )}

        {/* Bottom Actions Card */}
        <div className="print:hidden mt-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 text-center sm:text-left">
            Ready to publish on your hosted link or need adjustments?
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            {/* 1. Edit Information Button */}
            <Link
              href="/create"
              id="bottom-edit-info-btn"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-sm font-semibold shadow-xs transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Information</span>
            </Link>

            {/* 2. Deploy Policy Button */}
            <button
              type="button"
              id="bottom-deploy-btn"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 text-white text-sm font-semibold shadow-sm shadow-blue-600/20 hover:shadow-md transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>{isDeploying ? "Deploying..." : "Deploy Policy"}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Deployment Success & Hub Modal */}
      {showDeployModal && (
        <div id="deploy-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div id="deploy-modal" className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 transform transition-all">
            {isDeploying ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Publishing Your Privacy Policy...</h3>
                <p className="text-xs text-slate-500">Allocating your custom link and registering on your domain.</p>
              </div>
            ) : deploymentResult ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Your Policy is Live!</h3>
                    <p className="text-xs text-slate-500">Hosted and ready to paste into App Store Connect &amp; Google Play.</p>
                  </div>
                </div>

                {/* 1. Permanent Live Link Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Public URL (for App Store / Play Store / Website Footer):</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={deploymentResult.fullLiveUrl}
                      className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deploymentResult.fullLiveUrl, setCopiedLink)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        copiedLink ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {copiedLink ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </div>

                {/* 2. Embed Widget Code */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Website Embed &lt;iframe&gt; Code:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`<iframe src="${deploymentResult.fullLiveUrl}?embed=true" width="100%" height="600" frameborder="0"></iframe>`}
                      className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 truncate"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `<iframe src="${deploymentResult.fullLiveUrl}?embed=true" width="100%" height="600" frameborder="0"></iframe>`,
                          setCopiedEmbed
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        copiedEmbed ? "bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-900 text-white"
                      }`}
                    >
                      {copiedEmbed ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>

                {/* 3. Secret Edit Link */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 mb-4 text-xs text-amber-950">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Secret Edit Link:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const editUrl = `${window.location.origin}/create?edit=${deploymentResult.editToken}`;
                        copyToClipboard(editUrl, setCopiedEditLink);
                      }}
                      className="text-amber-800 font-semibold underline hover:text-amber-950"
                    >
                      {copiedEditLink ? "Copied Edit Link!" : "Copy Edit Link"}
                    </button>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-tight">
                    Save this link to edit and sync updates to your live policy anytime.
                  </p>
                </div>

                {/* Modal Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <a
                    href={deploymentResult.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    <span>Open Live Policy in New Tab</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowDeployModal(false)}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="mb-1">&copy; {new Date().getFullYear()} Privacy Policy Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
