"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  PolicyFormData,
  DEFAULT_FORM_DATA,
  CustomClause,
  MOBILE_PERMISSIONS_LIST,
  POPULAR_AD_NETWORKS,
  POPULAR_CRASH_REPORTING,
  POPULAR_ANALYTICS,
  POPULAR_AUTH,
  POPULAR_PAYMENTS,
  POPULAR_AI,
  slugify,
} from "@/lib/generatePrivacyPolicy";

interface FormErrors {
  companyName?: string;
  websiteUrl?: string;
  contactEmail?: string;
  country?: string;
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Netherlands",
  "Spain",
  "Italy",
  "Brazil",
  "Japan",
  "Singapore",
  "Sweden",
  "Switzerland",
  "United Arab Emirates",
  "South Africa",
  "New Zealand",
  "Ireland",
  "Mexico",
  "Other",
];

const PLATFORMS = [
  "Web & Mobile (iOS + Android)",
  "Mobile App Only (iOS / Android)",
  "Web Application / SaaS",
  "Shopify / E-Commerce Store",
];

function CreatePolicyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editToken = searchParams.get("edit");

  const [formData, setFormData] = useState<PolicyFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState("");
  const [newCustomContent, setNewCustomContent] = useState("");
  const [showAddClause, setShowAddClause] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (editToken) {
        try {
          const res = await fetch(`/api/deploy?editToken=${encodeURIComponent(editToken)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.formData) {
              setFormData(data.formData);
              return;
            }
          }
        } catch (e) {
          console.error("Failed to load policy by edit token:", e);
        }
      }

      try {
        const saved = localStorage.getItem("privacyPolicyData");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setFormData((prev) => ({
              ...prev,
              ...parsed,
            }));
          }
        }
      } catch (e) {
        console.error("Could not load stored policy form data:", e);
      }
    }

    loadData();
  }, [editToken]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "App or Company Name is required";
    }

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = "Website / App URL is required";
    } else {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
      if (!urlPattern.test(formData.websiteUrl.trim())) {
        newErrors.websiteUrl = "Please enter a valid URL (e.g. https://example.com)";
      }
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.contactEmail.trim())) {
        newErrors.contactEmail = "Please enter a valid email address";
      }
    }

    if (!formData.country.trim()) {
      newErrors.country = "Please select a country";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "companyName" && !prev.customSlug ? { customSlug: slugify(value) } : {}),
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleRadioChange = (key: keyof PolicyFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleArrayItem = (key: keyof PolicyFormData, item: string) => {
    setFormData((prev) => {
      const currentList = ((prev[key] as string[]) || []);
      const exists = currentList.includes(item);
      const updated = exists ? currentList.filter((i) => i !== item) : [...currentList, item];
      return {
        ...prev,
        [key]: updated,
      };
    });
  };

  const handleAddCustomClause = () => {
    if (!newCustomTitle.trim() || !newCustomContent.trim()) return;

    const newClause: CustomClause = {
      id: "clause-" + Date.now(),
      title: newCustomTitle.trim(),
      content: newCustomContent.trim(),
    };

    setFormData((prev) => ({
      ...prev,
      customClauses: [...(prev.customClauses || []), newClause],
    }));

    setNewCustomTitle("");
    setNewCustomContent("");
    setShowAddClause(false);
  };

  const handleDeleteCustomClause = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      customClauses: (prev.customClauses || []).filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      try {
        const payload = {
          ...formData,
          customSlug: formData.customSlug?.trim() ? slugify(formData.customSlug) : slugify(formData.tradingName || formData.companyName),
        };
        localStorage.setItem("privacyPolicyData", JSON.stringify(payload));
        router.push("/preview");
      } catch (err) {
        console.error("Error saving form data:", err);
        setIsSubmitting(false);
      }
    }
  };

  const previewSlug = slugify(formData.customSlug || formData.tradingName || formData.companyName || "my-app");

  return (
    <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2.5 shadow-xs">
          {editToken ? "Editing Deployed Policy" : "Production SaaS & App Store Compliance"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          {editToken ? "Update Your Privacy Policy" : "Create Production Privacy Policy"}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
          Tailored for Web, SaaS, iOS App Store, and Google Play Store compliance. Includes account deletion disclosures and nutrition label mapping.
        </p>
      </div>

      {/* Live Hosted Link Preview */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50/90 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          <span>Permanent Hosted Public Link:</span>
          <code className="font-mono bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-700 font-semibold">
            /p/{previewSlug}
          </code>
        </div>
        <span className="text-xs text-blue-700 font-semibold">Ready for App Store &amp; Play Store URLs</span>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Section 1: Entity & Platform Information */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">App &amp; Legal Entity Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Basic identity, platform scope, and jurisdiction</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Platform Selector */}
              <div>
                <label htmlFor="platform" className="block text-xs font-semibold text-slate-800 mb-1">
                  Target Platform <span className="text-rose-500">*</span>
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform || "Web & Mobile"}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legal Company Name */}
              <div>
                <label htmlFor="companyName" className="block text-xs font-semibold text-slate-800 mb-1">
                  Legal Entity / Developer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Acme Technologies Inc."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                    errors.companyName ? "border-rose-300 bg-rose-50/30 focus:ring-rose-200" : "border-slate-200 bg-slate-50/50 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.companyName && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.companyName}</p>}
              </div>

              {/* Trading / App Name */}
              <div>
                <label htmlFor="tradingName" className="block text-xs font-semibold text-slate-800 mb-1">
                  App Name in Stores <span className="text-slate-400 font-normal">(if different)</span>
                </label>
                <input
                  type="text"
                  id="tradingName"
                  name="tradingName"
                  value={formData.tradingName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Acme Task Manager"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Website URL */}
              <div>
                <label htmlFor="websiteUrl" className="block text-xs font-semibold text-slate-800 mb-1">
                  Website / App Landing URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                    errors.websiteUrl ? "border-rose-300 bg-rose-50/30 focus:ring-rose-200" : "border-slate-200 bg-slate-50/50 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.websiteUrl && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.websiteUrl}</p>}
              </div>

              {/* Custom URL Slug */}
              <div>
                <label htmlFor="customSlug" className="block text-xs font-semibold text-slate-800 mb-1">
                  Custom Hosted URL Slug
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-slate-400 font-mono">/p/</span>
                  <input
                    type="text"
                    id="customSlug"
                    name="customSlug"
                    value={formData.customSlug || ""}
                    onChange={handleChange}
                    placeholder={slugify(formData.tradingName || formData.companyName || "my-app")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 font-mono text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Email */}
              <div>
                <label htmlFor="contactEmail" className="block text-xs font-semibold text-slate-800 mb-1">
                  Privacy Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="privacy@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                    errors.contactEmail ? "border-rose-300 bg-rose-50/30 focus:ring-rose-200" : "border-slate-200 bg-slate-50/50 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.contactEmail}</p>}
              </div>

              {/* DPO Email */}
              <div>
                <label htmlFor="dpoEmail" className="block text-xs font-semibold text-slate-800 mb-1">
                  Data Protection Officer (DPO) <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  id="dpoEmail"
                  name="dpoEmail"
                  value={formData.dpoEmail || ""}
                  onChange={handleChange}
                  placeholder="dpo@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-xs font-semibold text-slate-800 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* State / Province */}
              <div>
                <label htmlFor="stateProvince" className="block text-xs font-semibold text-slate-800 mb-1">
                  State / Province <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  id="stateProvince"
                  name="stateProvince"
                  value={formData.stateProvince || ""}
                  onChange={handleChange}
                  placeholder="e.g. California"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>

              {/* Physical Address */}
              <div>
                <label htmlFor="physicalAddress" className="block text-xs font-semibold text-slate-800 mb-1">
                  Physical Address <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  id="physicalAddress"
                  name="physicalAddress"
                  value={formData.physicalAddress || ""}
                  onChange={handleChange}
                  placeholder="e.g. 100 Main St, Suite 400"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: App Store Mandatory Account Deletion Disclosures */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">App Store &amp; Google Play Account Deletion Policy</h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase">
                  Mandatory Store Requirement
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Required by Apple Guideline 5.1.1(v) &amp; Google Play Data Safety</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Does your app allow users to create accounts?</h3>
                <p className="text-xs text-slate-500">Apple and Google strictly require in-app account deletion if accounts can be created</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRadioChange("hasUserAccounts", "Yes")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    formData.hasUserAccounts === "Yes" ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleRadioChange("hasUserAccounts", "No")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                    formData.hasUserAccounts === "No" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {formData.hasUserAccounts === "Yes" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label htmlFor="accountDeletionMethod" className="block text-xs font-semibold text-slate-800 mb-1">
                    How can users delete their account?
                  </label>
                  <select
                    id="accountDeletionMethod"
                    name="accountDeletionMethod"
                    value={formData.accountDeletionMethod || "In-App Setting & Email Request"}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                  >
                    <option value="In-App Setting & Email Request">In-App (Settings &gt; Delete Account) &amp; Email</option>
                    <option value="In-App Setting Only">In-App Setting (Automated)</option>
                    <option value="Dedicated Web Deletion URL">Dedicated Web Deletion URL</option>
                    <option value="Email Request to Privacy Desk">Email Request to Privacy Desk</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="accountDeletionUrl" className="block text-xs font-semibold text-slate-800 mb-1">
                    Web Data Deletion URL <span className="text-slate-400 font-normal">(Required by Google Play)</span>
                  </label>
                  <input
                    type="text"
                    id="accountDeletionUrl"
                    name="accountDeletionUrl"
                    value={formData.accountDeletionUrl || ""}
                    onChange={handleChange}
                    placeholder={`${formData.websiteUrl || "https://example.com"}/delete-account`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Mobile Hardware Permissions & Sensors */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mobile Device Hardware Permissions</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select all runtime hardware sensors requested by your iOS/Android app</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MOBILE_PERMISSIONS_LIST.map((permission) => {
              const selected = (formData.mobilePermissions || []).includes(permission);
              return (
                <button
                  key={permission}
                  type="button"
                  onClick={() => toggleArrayItem("mobilePermissions", permission)}
                  className={`p-3.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                    selected
                      ? "border-blue-500 bg-blue-50/40 text-blue-950 font-medium"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="text-xs">
                    <span className="font-bold block mb-0.5">{permission.split("(")[0].trim()}</span>
                    <span className="text-slate-500 text-[11px]">{permission.includes("(") ? "(" + permission.split("(")[1] : ""}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${selected ? "text-blue-600" : "text-slate-300"}`}>
                    {selected ? "✓ Enabled" : "+ Add"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Advertising, Tracking (IDFA / ATT) & Crash Reporting */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              4
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ad Networks, Apple ATT (IDFA) &amp; Crash Diagnostics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ad monetization disclosures and stability telemetry</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Advertising & IDFA */}
            <div className="p-4.5 rounded-xl bg-white border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">In-App Ads &amp; Advertising Identifier (IDFA / AAID)</h3>
                  <p className="text-xs text-slate-500">Do you display ads or track advertising conversions?</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleRadioChange("usesAdTracking", "Yes");
                      handleRadioChange("usesIDFA", "Yes");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      formData.usesAdTracking === "Yes" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRadioChange("usesAdTracking", "No");
                      handleRadioChange("usesIDFA", "No");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      formData.usesAdTracking === "No" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {formData.usesAdTracking === "Yes" && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 block mb-2">Select active ad networks:</span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_AD_NETWORKS.map((adNet) => {
                      const selected = (formData.adNetworks || []).includes(adNet);
                      return (
                        <button
                          key={adNet}
                          type="button"
                          onClick={() => toggleArrayItem("adNetworks", adNet)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            selected ? "bg-purple-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {adNet}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Crash Reporting */}
            <div className="p-4.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-sm font-bold text-slate-800 block mb-1">Crash Reporting &amp; Diagnostics Tools</span>
              <p className="text-xs text-slate-500 mb-3">Google Play Data Safety requires reporting crash telemetry</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CRASH_REPORTING.map((crashTool) => {
                  const selected = (formData.crashReportingServices || []).includes(crashTool);
                  return (
                    <button
                      key={crashTool}
                      type="button"
                      onClick={() => toggleArrayItem("crashReportingServices", crashTool)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        selected ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {crashTool}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Analytics, Payments, Socials & AI */}
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center">
              5
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Analytics, Store Billing &amp; AI Integrations</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select specific services to configure automated disclosures</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Analytics */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 block mb-2">Analytics &amp; Usage Telemetry:</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_ANALYTICS.map((tool) => {
                  const selected = (formData.analyticsServices || []).includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleArrayItem("analyticsServices", tool)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        selected ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In-App Purchases & Payments */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 block mb-2">In-App Purchases &amp; Payment Processors:</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PAYMENTS.map((payment) => {
                  const selected = (formData.paymentProcessors || []).includes(payment);
                  return (
                    <button
                      key={payment}
                      type="button"
                      onClick={() => toggleArrayItem("paymentProcessors", payment)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        selected ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {payment}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Logins */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 block mb-2">Social Login &amp; Authentication Providers:</span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_AUTH.map((auth) => {
                  const selected = (formData.authProviders || []).includes(auth);
                  return (
                    <button
                      key={auth}
                      type="button"
                      onClick={() => toggleArrayItem("authProviders", auth)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        selected ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {auth}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Integrations */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">AI / LLM Cloud APIs (OpenAI, Anthropic, Gemini):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRadioChange("usesAI", "Yes")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      formData.usesAI === "Yes" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRadioChange("usesAI", "No")}
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      formData.usesAI === "No" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {formData.usesAI === "Yes" && (
                <div className="mt-2 pt-2 border-t border-slate-200/70">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {POPULAR_AI.map((ai) => {
                      const selected = (formData.aiServices || []).includes(ai);
                      return (
                        <button
                          key={ai}
                          type="button"
                          onClick={() => toggleArrayItem("aiServices", ai)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            selected ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-700"
                          }`}
                        >
                          {selected ? "✓ " : "+ "}
                          {ai}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 6: Custom Clauses Builder */}
        <div className="p-6 sm:p-8 bg-slate-50/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                6
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Custom Clauses &amp; Disclosures</h2>
                <p className="text-xs text-slate-500 mt-0.5">Insert custom terms, beta notices, or industry-specific disclosures</p>
              </div>
            </div>

            {!showAddClause && (
              <button
                type="button"
                onClick={() => setShowAddClause(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition"
              >
                <span>+ Add Custom Clause</span>
              </button>
            )}
          </div>

          {/* List of custom clauses */}
          {formData.customClauses && formData.customClauses.length > 0 && (
            <div className="space-y-3 mb-4">
              {formData.customClauses.map((clause) => (
                <div key={clause.id} className="p-4 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{clause.title}</h4>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-2">{clause.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomClause(clause.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-1 hover:bg-rose-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Clause Form */}
          {showAddClause && (
            <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-sm space-y-3 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">New Custom Section</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Clause Title</label>
                <input
                  type="text"
                  value={newCustomTitle}
                  onChange={(e) => setNewCustomTitle(e.target.value)}
                  placeholder="e.g. Beta Tester Program Terms or HIPAA Compliance"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">Clause Paragraphs</label>
                <textarea
                  rows={3}
                  value={newCustomContent}
                  onChange={(e) => setNewCustomContent(e.target.value)}
                  placeholder="Write the specific terms or disclosures here..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddClause(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomClause}
                  disabled={!newCustomTitle.trim() || !newCustomContent.trim()}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Insert Clause
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 transition order-2 sm:order-1">
            Cancel &amp; Return Home
          </Link>

          <button
            type="submit"
            id="generate-policy-btn"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 shadow-md shadow-blue-600/20 hover:shadow-lg transition duration-150 order-1 sm:order-2"
          >
            <span>{isSubmitting ? "Generating Preview..." : "Generate Privacy Policy"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-slate-900 hover:opacity-90 transition"
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

          <div className="flex items-center gap-3">
            <Link
              href="/"
              id="back-to-home-link"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <CreatePolicyForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="mb-1">&copy; {new Date().getFullYear()} Privacy Policy Generator. Production App Store &amp; Play Store Ready.</p>
        </div>
      </footer>
    </div>
  );
}
