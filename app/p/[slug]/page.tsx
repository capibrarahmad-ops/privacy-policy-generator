import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPolicyBySlug } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug);

  if (!policy) {
    return {
      title: "Privacy Policy Not Found",
      description: "The requested privacy policy document could not be found.",
    };
  }

  const title = `Privacy Policy | ${policy.formData.tradingName || policy.companyName}`;
  const description = `Official Privacy Policy for ${policy.companyName}. Last updated: ${policy.generatedPolicy.lastUpdated}.`;

  return {
    title,
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

  const record = getPolicyBySlug(slug, true);

  if (!record) {
    notFound();
  }

  const { generatedPolicy: policy } = record;

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
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs">
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
              <span className="hidden sm:inline">Privacy Policy Generator</span>
              <span className="sm:hidden">Policy</span>
            </Link>

            <div className="flex items-center gap-2">
              <a
                href={policy.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition truncate max-w-[180px] sm:max-w-none"
              >
                Visit {policy.companyName} &rarr;
              </a>
            </div>
          </div>
        </header>
      )}

      {/* Main Document Layout */}
      <main className={`flex-1 max-w-4xl w-full mx-auto ${isEmbed ? "p-0" : "px-4 sm:px-6 py-8 sm:py-12"}`}>
        {/* Document Sheet */}
        <article
          id="public-policy-content"
          className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 md:p-14 text-slate-800 leading-relaxed font-sans"
        >
          {/* Header */}
          <div className="border-b border-slate-200 pb-7 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Official Document
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Privacy Policy for {policy.companyName}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
              <div>
                <span className="text-slate-400">Website:</span>{" "}
                <a
                  href={policy.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
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

          {/* Sections List */}
          <div className="space-y-8 sm:space-y-10">
            {policy.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="scroll-mt-16">
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
                          {bullet.title && (
                            <strong className="text-slate-900 font-semibold">
                              {bullet.title}:{" "}
                            </strong>
                          )}
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
          <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              This policy is maintained by {policy.companyName}.
            </span>
            <span className="text-slate-400">
              Hosted via <Link href="/" className="text-blue-600 hover:underline">Privacy Policy Generator</Link>
            </span>
          </div>
        </article>
      </main>

      {/* Public Footer */}
      {!isEmbed && (
        <footer className="print:hidden border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; {new Date().getFullYear()} {policy.companyName}. All rights reserved.</p>
            <p>
              Need a privacy policy for your app?{" "}
              <Link href="/create" className="text-blue-600 font-semibold hover:underline">
                Create yours free
              </Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
