import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-slate-900 hover:opacity-90 transition"
            id="nav-brand-link"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className="w-5 h-5"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <span>Privacy Policy Generator</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#app-store" className="hover:text-blue-600 transition-colors">
              App Store &amp; Play
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/create"
              id="nav-create-btn"
              className="inline-flex items-center justify-center text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-600/20 transition-all duration-150"
            >
              Create Free Policy
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pb-32 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/50">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-blue-200/40 via-indigo-100/40 to-cyan-100/30 blur-3xl -z-10 pointer-events-none rounded-full"
            aria-hidden="true"
          />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs sm:text-sm font-medium mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Web, iOS App Store &amp; Google Play Ready &middot; Instant Hosted Public Link
            </div>

            {/* Primary Hero Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6">
              Generate &amp; Host Your Privacy Policy{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                in Under 3 Minutes
              </span>
            </h1>

            {/* Short Description */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 sm:mb-10">
              Compliant privacy policy generator for mobile applications and websites. Includes mandatory Apple Guideline 5.1.1(v) account deletion clauses, Google Play Data Safety mapping, and free public link hosting.
            </p>

            {/* Primary CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-12">
              <Link
                href="/create"
                id="hero-create-policy-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>Generate Your Policy Now</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-4 h-4"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-xs sm:text-sm font-medium text-slate-600">
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Apple Store Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Google Play Data Safety</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Free Hosted Link (/p/slug)</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>GDPR &amp; CCPA CalOPPA</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Store Compliance Section */}
        <section id="app-store" className="py-16 bg-white border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                Mobile Store Approval Guaranteed
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Built to Pass App Store &amp; Google Play Reviews
              </p>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Over 40% of mobile app rejections stem from missing privacy disclosures. We automatically generate all required clauses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 font-bold">
                  
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Apple Account Deletion 5.1.1(v)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Explicit step-by-step disclosures on how users can permanently delete their accounts and personal data from within the app.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4 font-bold text-sm">
                  ▶
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Google Play Data Safety Form</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generates an exact copy-paste guide for your Google Play Console Data Safety declaration covering collected and shared telemetry.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 font-bold text-sm">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Free Permanent Hosted Link</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Get an instant public link (<code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-xs">yourdomain.com/p/your-app</code>) ready to paste into App Store Connect and Google Play Console.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                Simple 3-Step Process
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                How It Works
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Configure App &amp; Services</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Select your platform (Web, iOS, Android), device permissions, crash diagnostics, AI integrations, and payment processors.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Review &amp; Customize</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Inspect the live document preview, App Store Privacy Nutrition labels, and Google Play Data Safety form summary.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Deploy &amp; Get Link</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Click Deploy to publish your policy on your custom URL. Paste into App Store Connect, Google Play Console, or embed as an iframe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-14 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Ready to Publish Your Privacy Policy?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base mb-6 max-w-xl mx-auto">
              Create a compliant policy for Web, iOS, and Android in under 3 minutes.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-white text-blue-700 hover:bg-blue-50 transition shadow-md"
            >
              <span>Create Privacy Policy</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="mb-1">&copy; {new Date().getFullYear()} Privacy Policy Generator SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
