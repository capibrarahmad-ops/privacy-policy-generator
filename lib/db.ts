import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PolicyFormData, GeneratedPolicy, generatePrivacyPolicy, slugify } from "./generatePrivacyPolicy";

export interface StoredPolicyRecord {
  id: string;
  slug: string;
  companyName: string;
  websiteUrl: string;
  contactEmail: string;
  country: string;
  editToken: string;
  formData: PolicyFormData;
  generatedPolicy: GeneratedPolicy;
  views: number;
  createdAt: string;
  updatedAt: string;
}

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "signup",
  "dashboard",
  "terms",
  "privacy",
  "create",
  "preview",
  "p",
  "settings",
  "pricing",
  "blog",
  "docs",
  "help",
  "support",
  "auth",
  "account",
  "delete-account",
  "robots.txt",
  "sitemap.xml",
]);

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "policies.json");

// Supabase client initialization
let supabase: SupabaseClient | null = null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nowlzmlmnpwgtakotcpg.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_4xbNek76u0pNK_jVoPt_YQ_DoHQHVrz";

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  } catch (err) {
    console.warn("Supabase client init error, relying on local store:", err);
  }
}

export { supabase };

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function readAllPolicies(): StoredPolicyRecord[] {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as StoredPolicyRecord[];
  } catch (err) {
    console.error("Error reading policies db:", err);
    return [];
  }
}

function writeAllPolicies(policies: StoredPolicyRecord[]) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(policies, null, 2), "utf8");
}

export function isSlugAvailable(slug: string, currentId?: string): boolean {
  const normalized = slugify(slug);
  if (RESERVED_SLUGS.has(normalized)) return false;

  const policies = readAllPolicies();
  return !policies.some((p) => p.slug === normalized && p.id !== currentId);
}

export function generateUniqueSlug(preferred: string): string {
  const base = slugify(preferred || "app-privacy");
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-policy` : base;
  let counter = 1;

  while (!isSlugAvailable(candidate)) {
    counter++;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

export async function deployPolicy(params: {
  formData: PolicyFormData;
  requestedSlug?: string;
  editToken?: string;
}): Promise<{ policy: StoredPolicyRecord; isNew: boolean }> {
  const policies = readAllPolicies();
  const now = new Date().toISOString();

  // If an editToken is provided, update the existing policy
  if (params.editToken) {
    const existingIndex = policies.findIndex((p) => p.editToken === params.editToken);
    if (existingIndex !== -1) {
      const existing = policies[existingIndex];
      const updatedPolicy = generatePrivacyPolicy({
        ...params.formData,
        lastUpdated: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      let newSlug = existing.slug;
      if (params.requestedSlug && params.requestedSlug.trim()) {
        const candidate = slugify(params.requestedSlug);
        if (candidate === existing.slug || isSlugAvailable(candidate, existing.id)) {
          newSlug = candidate;
        }
      }

      existing.slug = newSlug;
      existing.companyName = params.formData.companyName;
      existing.websiteUrl = params.formData.websiteUrl;
      existing.contactEmail = params.formData.contactEmail;
      existing.country = params.formData.country;
      existing.formData = params.formData;
      existing.generatedPolicy = {
        ...updatedPolicy,
        slug: newSlug,
      };
      existing.updatedAt = now;

      writeAllPolicies(policies);

      // Cloud Database Sync (Supabase)
      if (supabase) {
        try {
          await supabase
            .from("policies")
            .upsert({
              id: existing.id,
              slug: existing.slug,
              company_name: existing.companyName,
              website_url: existing.websiteUrl,
              contact_email: existing.contactEmail,
              country: existing.country,
              edit_token: existing.editToken,
              form_data: existing.formData,
              generated_policy: existing.generatedPolicy,
              views: existing.views,
              updated_at: now,
            });
        } catch (supabaseErr) {
          console.warn("Supabase upsert note (table may not be created yet):", supabaseErr);
        }
      }

      return { policy: existing, isNew: false };
    }
  }

  // Create new policy
  const chosenSlug = generateUniqueSlug(
    params.requestedSlug || params.formData.customSlug || params.formData.tradingName || params.formData.companyName
  );

  const editToken = crypto.randomBytes(24).toString("hex");
  const generated = generatePrivacyPolicy({
    ...params.formData,
    customSlug: chosenSlug,
    lastUpdated: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  const record: StoredPolicyRecord = {
    id: crypto.randomUUID(),
    slug: chosenSlug,
    companyName: params.formData.companyName,
    websiteUrl: params.formData.websiteUrl,
    contactEmail: params.formData.contactEmail,
    country: params.formData.country,
    editToken,
    formData: params.formData,
    generatedPolicy: generated,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  policies.push(record);
  writeAllPolicies(policies);

  // Cloud Database Sync (Supabase)
  if (supabase) {
    try {
      await supabase
        .from("policies")
        .insert({
          id: record.id,
          slug: record.slug,
          company_name: record.companyName,
          website_url: record.websiteUrl,
          contact_email: record.contactEmail,
          country: record.country,
          edit_token: record.editToken,
          form_data: record.formData,
          generated_policy: record.generatedPolicy,
          views: 0,
          created_at: now,
          updated_at: now,
        });
    } catch (supabaseErr) {
      console.warn("Supabase insert note (table may not be created yet):", supabaseErr);
    }
  }

  return { policy: record, isNew: true };
}

export function getPolicyBySlug(slug: string, incrementView = false): StoredPolicyRecord | null {
  const policies = readAllPolicies();
  const normalized = slugify(slug);
  const found = policies.find((p) => p.slug === normalized);

  if (!found) return null;

  if (incrementView) {
    found.views = (found.views || 0) + 1;
    writeAllPolicies(policies);

    if (supabase) {
      try {
        supabase
          .from("policies")
          .update({ views: found.views })
          .eq("id", found.id)
          .then();
      } catch {}
    }
  }

  return found;
}

export function getPolicyByEditToken(token: string): StoredPolicyRecord | null {
  if (!token) return null;
  const policies = readAllPolicies();
  return policies.find((p) => p.editToken === token) || null;
}
