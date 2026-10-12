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
    notFound();
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
