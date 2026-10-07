import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  PolicyFormData,
  GeneratedPolicy,
  generatePrivacyPolicy,
  slugify,
} from "./generatePrivacyPolicy";

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
  "favicon.ico",
]);

// Supabase configuration with robust defaults for zero-config deployment
const SUPABASE_DEFAULT_URL = "https://nowlzmlmnpwgtakotcpg.supabase.co";
const SUPABASE_DEFAULT_KEY = "sb_publishable_4xbNek76u0pNK_jVoPt_YQ_DoHQHVrz";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  SUPABASE_DEFAULT_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  SUPABASE_DEFAULT_KEY;

let supabase: SupabaseClient | null = null;

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

// ---------------------------------------------------------------------------
// Serverless-safe fallback store (In-memory + /tmp or local data directory)
// ---------------------------------------------------------------------------
const memoryStore: Map<string, StoredPolicyRecord> = new Map();

function getSafeDbFilePath(): string {
  // In serverless environments (e.g. Vercel, AWS Lambda), process.cwd() is read-only.
  // Use os.tmpdir() which is always writable in serverless lambdas.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "policies.json");
  }
  return path.join(process.cwd(), "data", "policies.json");
}

function readLocalPolicies(): StoredPolicyRecord[] {
  try {
    const dbPath = getSafeDbFilePath();
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf8");
      const list = JSON.parse(raw) as StoredPolicyRecord[];
      if (Array.isArray(list)) {
        list.forEach((p) => memoryStore.set(p.id, p));
        return list;
      }
    }
  } catch {
    // Readonly FS or JSON parse failure - safely fallback to memoryStore
  }
  return Array.from(memoryStore.values());
}

function writeLocalPolicies(policies: StoredPolicyRecord[]): void {
  try {
    policies.forEach((p) => memoryStore.set(p.id, p));
    const dbPath = getSafeDbFilePath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(policies, null, 2), "utf8");
  } catch {
    // Silently continue - memoryStore and Supabase handle persistence
  }
}

function saveLocalPolicy(record: StoredPolicyRecord): void {
  const list = readLocalPolicies().filter((p) => p.id !== record.id);
  list.push(record);
  writeLocalPolicies(list);
}

function updateLocalPolicy(record: StoredPolicyRecord): void {
  const list = readLocalPolicies();
  const idx = list.findIndex((p) => p.id === record.id);
  if (idx !== -1) {
    list[idx] = record;
  } else {
    list.push(record);
  }
  writeLocalPolicies(list);
}

// ---------------------------------------------------------------------------
// Helpers to map between DB row and Typescript record
// ---------------------------------------------------------------------------
function mapRowToPolicyRecord(row: any): StoredPolicyRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    companyName: row.company_name || row.companyName || "",
    websiteUrl: row.website_url || row.websiteUrl || "",
    contactEmail: row.contact_email || row.contactEmail || "",
    country: row.country || "",
    editToken: row.edit_token || row.editToken || "",
    formData: (typeof row.form_data === "string" ? JSON.parse(row.form_data) : row.form_data) || row.formData,
    generatedPolicy: (typeof row.generated_policy === "string" ? JSON.parse(row.generated_policy) : row.generated_policy) || row.generatedPolicy,
    views: typeof row.views === "number" ? row.views : 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

function mapRecordToRow(record: StoredPolicyRecord) {
  return {
    id: record.id,
    slug: record.slug,
    company_name: record.companyName,
    website_url: record.websiteUrl,
    contact_email: record.contactEmail,
    country: record.country,
    edit_token: record.editToken,
    form_data: record.formData,
    generated_policy: record.generatedPolicy,
    views: record.views,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Core Asynchronous Database API
// ---------------------------------------------------------------------------

export async function isSlugAvailable(slug: string, currentId?: string): Promise<boolean> {
  const normalized = slugify(slug);
  if (!normalized || RESERVED_SLUGS.has(normalized)) return false;

  if (supabase) {
    try {
      let query = supabase.from("policies").select("id").eq("slug", normalized);
      if (currentId) {
        query = query.neq("id", currentId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.length === 0;
      }
    } catch (err) {
      console.warn("Supabase isSlugAvailable check fallback:", err);
    }
  }

  const policies = readLocalPolicies();
  return !policies.some((p) => p.slug === normalized && p.id !== currentId);
}

export async function generateUniqueSlug(preferred: string): Promise<string> {
  const base = slugify(preferred || "app-privacy");
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-policy` : base;
  let counter = 1;

  while (!(await isSlugAvailable(candidate))) {
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
  const now = new Date().toISOString();

  // If an editToken is provided, update the existing policy
  if (params.editToken) {
    const existing = await getPolicyByEditToken(params.editToken);
    if (existing) {
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
        if (candidate === existing.slug || (await isSlugAvailable(candidate, existing.id))) {
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

      // Update in Supabase
      if (supabase) {
        try {
          const { error: upsertErr } = await supabase
            .from("policies")
            .upsert(mapRecordToRow(existing), { onConflict: "id" });
          if (upsertErr) {
            console.warn("Supabase upsert note:", upsertErr);
          }
        } catch (supabaseErr) {
          console.warn("Supabase update error:", supabaseErr);
        }
      }

      // Update local storage safely
      updateLocalPolicy(existing);

      return { policy: existing, isNew: false };
    }
  }

  // Create new policy
  const chosenSlug = await generateUniqueSlug(
    params.requestedSlug ||
      params.formData.customSlug ||
      params.formData.tradingName ||
      params.formData.companyName
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

  // Insert into Supabase
  if (supabase) {
    try {
      const { error: insertErr } = await supabase
        .from("policies")
        .insert(mapRecordToRow(record));
      if (insertErr) {
        console.warn("Supabase insert note:", insertErr);
      }
    } catch (supabaseErr) {
      console.warn("Supabase insert error:", supabaseErr);
    }
  }

  // Save to local storage safely
  saveLocalPolicy(record);

  return { policy: record, isNew: true };
}

export async function getPolicyBySlug(
  slug: string,
  incrementView = false
): Promise<StoredPolicyRecord | null> {
  const normalized = slugify(slug);
  if (!normalized) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("slug", normalized)
        .maybeSingle();

      if (!error && data) {
        const record = mapRowToPolicyRecord(data);
        if (incrementView) {
          const newViews = (record.views || 0) + 1;
          record.views = newViews;
          try {
            await supabase
              .from("policies")
              .update({ views: newViews, updated_at: new Date().toISOString() })
              .eq("id", record.id);
          } catch {}
        }
        return record;
      }
    } catch (err) {
      console.warn("Supabase getPolicyBySlug query error, checking local store:", err);
    }
  }

  const policies = readLocalPolicies();
  const found = policies.find((p) => p.slug === normalized);
  if (!found) return null;

  if (incrementView) {
    found.views = (found.views || 0) + 1;
    writeLocalPolicies(policies);
  }

  return found;
}

export async function getPolicyByEditToken(token: string): Promise<StoredPolicyRecord | null> {
  if (!token) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("edit_token", token)
        .maybeSingle();

      if (!error && data) {
        return mapRowToPolicyRecord(data);
      }
    } catch (err) {
      console.warn("Supabase getPolicyByEditToken error:", err);
    }
  }

  const policies = readLocalPolicies();
  return policies.find((p) => p.editToken === token) || null;
}
