import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPolicyBySlug } from "@/lib/db";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PrintButton } from "@/components/PrintButton";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPolicyBySlug(slug, false, true);

  if (!policy || !policy.isPublished) {
    return {
      title: "Privacy Policy Not Found",
      description: "The requested privacy policy document could not be found or has not been published.",
    };
  }

  const title = `${policy.title || policy.companyName || "Privacy Policy"}`;
  const description = `Official Privacy Policy. Published: ${new Date(policy.publishedAt || policy.createdAt).toLocaleDateString()}.`;

  return {
    title: `${title} | PrivacyFlow`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function PublicPolicyPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "true";

  // Enforce privacy: only published policies are accessible to the public
  const record = await getPolicyBySlug(slug, true, true);

  if (!record || !record.isPublished) {
    // Check if it's a private unpublished draft
    const draftRecord = await getPolicyBySlug(slug, false, false);
    const isPrivateDraft = Boolean(draftRecord && !draftRecord.isPublished);

    if (isEmbed) {
      return (
        <div className="min-h-[240px] flex flex-col items-center justify-center p-6 bg-white text-slate-800 text-center font-sans border border-slate-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {isPrivateDraft ? "Privacy Policy Not Published" : "Privacy Policy Not Found"}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
            {isPrivateDraft
              ? "This privacy policy has been created but is currently saved as an unpublished private draft."
              : `No published policy was found at /p/${slug}. Please verify the URL.`}
          </p>
          <Link
            href="/"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by PrivacyFlow
          </Link>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 hover:opacity-90 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white text-xs shadow-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="w-4 h-4"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span>
                Privacy<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            <Link
              href="/create"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
            >
              Create Your Policy &rarr;
            </Link>
          </div>
        </header>

        {/* Helpful Message Container */}
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col justify-center">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center">
            {isPrivateDraft ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-3 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Private Draft Document
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  This Policy Has Not Been Published Yet
                </h1>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  The privacy policy for <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-xs">/p/{slug}</code> exists in our system, but it is currently saved as an unpublished private draft.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5 mb-6">
                  <p className="font-semibold text-slate-800">What does this mean?</p>
                  <p>&bull; Only published policies are accessible to the public and visitors.</p>
                  <p>&bull; If you are the owner, sign in to your account and click <strong>Deploy</strong> to make it live.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link
                    href={draftRecord?.id ? `/policy/${draftRecord.id}` : "/"}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
                  >
                    Sign In to Publish Policy
                  </Link>
                  <Link
                    href="/create"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition"
                  >
                    Create a New Policy
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-3 border border-rose-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  404 &bull; Policy Not Found
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Privacy Policy Not Found
                </h1>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  We could not find an active privacy policy hosted at:
                </p>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800 mb-5 break-all max-w-full">
                  /p/{slug}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1.5 mb-6">
                  <p className="font-semibold text-slate-800">Possible reasons:</p>
                  <p>&bull; The link may be mistyped or contains extra characters.</p>
                  <p>&bull; The policy was not deployed or has been removed by its author.</p>
                  <p>&bull; If you just deployed this policy, please refresh in a few moments.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <Link
                    href="/create"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
                  >
                    Generate Your Policy
                  </Link>
                  <Link
                    href="/"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; {new Date().getFullYear()} PrivacyFlow. All rights reserved.</p>
            <p>
              Hosted with{" "}
              <Link href="/" className="text-blue-600 font-semibold hover:underline">
                PrivacyFlow Generator
              </Link>
            </p>
          </div>
        </footer>
      </div>
    );
  }

  const markdownContent =
    record.markdownContent ||
    record.generatedPolicy?.markdown ||
    record.rawContent ||
    "";

  const displayTitle = record.title || record.companyName || "Privacy Policy";
  const publishedDate = record.publishedAt || record.createdAt;
  const formattedDate = new Date(publishedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isEmbed ? "bg-white p-4" : "bg-slate-100/70 text-slate-900 selection:bg-blue-600 selection:text-white"
      }`}
    >
      {/* Top Navbar (Hidden when embedded or printed) */}
      {!isEmbed && (
        <header className="print:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 hover:opacity-90 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white text-xs shadow-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="w-4 h-4"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span>
                Privacy<span className="text-blue-600">Flow</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <PrintButton />

              {record.websiteUrl && record.websiteUrl.startsWith("http") && (
                <a
                  href={record.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition truncate max-w-[180px] sm:max-w-none"
                >
                  Visit Website &rarr;
                </a>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Document Layout */}
      <main className={`flex-1 max-w-4xl w-full mx-auto ${isEmbed ? "p-0" : "px-4 sm:px-6 py-8 sm:py-12"}`}>
        <article
          id="public-policy-document"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 md:p-14 text-slate-800 leading-relaxed font-sans"
        >
          {/* Header Metadata */}
          <div className="border-b border-slate-200 pb-7 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Official Published Privacy Policy
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              {displayTitle}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
              <div>
                <span className="text-slate-400">Published / Effective Date:</span>{" "}
                <span className="text-slate-700 font-semibold">{formattedDate}</span>
              </div>
              <div>&bull;</div>
              <div>
                <span className="text-slate-400">Status:</span>{" "}
                <span className="text-emerald-600 font-semibold">Active Document</span>
              </div>
              {record.country && record.country !== "Worldwide" && (
                <>
                  <div>&bull;</div>
                  <div>
                    <span className="text-slate-400">Jurisdiction:</span>{" "}
                    <span className="text-slate-700">{record.country}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rendered Markdown Body */}
          <div className="space-y-6">
            <MarkdownRenderer content={markdownContent} stripFirstHeading={true} />
          </div>

          {/* Document Footer Disclaimer */}
          <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              Maintained and published by {displayTitle}.
            </span>
            <span className="text-slate-400">
              Published via{" "}
              <Link href="/" className="text-blue-600 hover:underline">
                PrivacyFlow
              </Link>
            </span>
          </div>
        </article>
      </main>

      {/* Public Footer */}
      {!isEmbed && (
        <footer className="print:hidden border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; {new Date().getFullYear()} {displayTitle}. All rights reserved.</p>
            <p>
              Publish your own privacy policy &bull;{" "}
              <Link href="/create" className="text-blue-600 font-semibold hover:underline">
                PrivacyFlow
              </Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
