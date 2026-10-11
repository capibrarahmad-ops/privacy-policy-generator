import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  PolicyFormData,
  GeneratedPolicy,
  generatePrivacyPolicy,
  generatePolicyFromDescription,
  slugify,
} from "./generatePrivacyPolicy";

export interface StoredPolicyRecord {
  id: string;
  slug: string;
  userId?: string;
  description?: string;
  isPublished?: boolean;
  publishedAt?: string;
  companyName: string;
  websiteUrl: string;
  contactEmail: string;
  country: string;
  editToken: string;
  formData: PolicyFormData | any;
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
  "policy",
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

// Supabase configuration
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
    // Readonly FS or JSON parse failure - fallback to memoryStore
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
    // Continue - memoryStore and Supabase handle persistence
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
  const formData = (typeof row.form_data === "string" ? JSON.parse(row.form_data) : row.form_data) || row.formData || {};
  const generatedPolicy = (typeof row.generated_policy === "string" ? JSON.parse(row.generated_policy) : row.generated_policy) || row.generatedPolicy || {};

  return {
    id: String(row.id),
    slug: String(row.slug),
    userId: row.user_id || formData?.user_id || undefined,
    description: row.description || formData?.description || "",
    isPublished: typeof row.is_published === "boolean" ? row.is_published : Boolean(formData?.is_published),
    publishedAt: row.published_at || formData?.published_at || undefined,
    companyName: row.company_name || row.companyName || generatedPolicy.companyName || "",
    websiteUrl: row.website_url || row.websiteUrl || generatedPolicy.websiteUrl || "",
    contactEmail: row.contact_email || row.contactEmail || generatedPolicy.contactEmail || "",
    country: row.country || generatedPolicy.country || "",
    editToken: row.edit_token || row.editToken || "",
    formData,
    generatedPolicy,
    views: typeof row.views === "number" ? row.views : 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

async function upsertPolicyToSupabase(record: StoredPolicyRecord): Promise<{ error: any }> {
  if (!supabase) return { error: null };

  const baseRow = {
    id: record.id,
    slug: record.slug,
    company_name: record.companyName,
    website_url: record.websiteUrl,
    contact_email: record.contactEmail,
    country: record.country,
    edit_token: record.editToken,
    form_data: {
      ...(record.formData || {}),
      user_id: record.userId,
      description: record.description,
      is_published: Boolean(record.isPublished),
      published_at: record.publishedAt,
    },
    generated_policy: record.generatedPolicy,
    views: record.views,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };

  try {
    // Attempt upsert with explicit columns first (if migration has run)
    const extendedRow = {
      ...baseRow,
      user_id: record.userId || null,
      description: record.description || null,
      is_published: Boolean(record.isPublished),
      published_at: record.publishedAt || null,
    };
    const { error } = await supabase.from("policies").upsert(extendedRow, { onConflict: "id" });
    if (!error) return { error: null };

    // If column missing (e.g. 42703), retry with guaranteed baseRow
    if (error.code === "42703" || error.message?.includes("column")) {
      const { error: baseError } = await supabase.from("policies").upsert(baseRow, { onConflict: "id" });
      return { error: baseError };
    }
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

// ---------------------------------------------------------------------------
// Core Database API
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
      console.warn("Supabase isSlugAvailable fallback:", err);
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

export interface CreateDraftPolicyParams {
  id?: string;
  description: string;
  userId?: string;
  generatedPolicy?: GeneratedPolicy;
  customSlug?: string;
}

export async function createDraftPolicy(params: CreateDraftPolicyParams): Promise<StoredPolicyRecord> {
  const now = new Date().toISOString();
  const id = params.id || crypto.randomUUID();

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let generated = params.generatedPolicy;
  if (!generated) {
    generated = generatePolicyFromDescription(params.description, {
      lastUpdated: formattedDate,
    });
  }

  const companyName =
    generated.companyName && !generated.companyName.includes("Needs Confirmation")
      ? generated.companyName
      : "My Application";

  const preferredSlug =
    params.customSlug ||
    (generated.slug && !generated.slug.includes("needs-confirmation") ? generated.slug : "") ||
    (companyName !== "My Application" ? slugify(companyName) : "app-privacy");

  const chosenSlug = await generateUniqueSlug(preferredSlug);
  generated.slug = chosenSlug;

  const editToken = crypto.randomBytes(24).toString("hex");

  const record: StoredPolicyRecord = {
    id,
    slug: chosenSlug,
    userId: params.userId,
    description: params.description,
    isPublished: false,
    companyName,
    websiteUrl: generated.websiteUrl || "",
    contactEmail: generated.contactEmail || "",
    country: generated.country || "Worldwide",
    editToken,
    formData: {
      description: params.description,
      user_id: params.userId,
      is_published: false,
    },
    generatedPolicy: generated,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Persist to Supabase
  await upsertPolicyToSupabase(record);

  // Persist to safe local store
  saveLocalPolicy(record);

  return record;
}

export async function getPolicyById(id: string): Promise<StoredPolicyRecord | null> {
  if (!id) return null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        return mapRowToPolicyRecord(data);
      }
    } catch (err) {
      console.warn("Supabase getPolicyById error, checking local store:", err);
    }
  }

  const policies = readLocalPolicies();
  return policies.find((p) => p.id === id) || null;
}

export async function updatePolicyContent(
  id: string,
  updates: {
    markdown?: string;
    sections?: any[];
    companyName?: string;
    websiteUrl?: string;
    contactEmail?: string;
    country?: string;
    isPublished?: boolean;
    slug?: string;
  }
): Promise<StoredPolicyRecord | null> {
  const existing = await getPolicyById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const lastUpdatedFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const updatedGenerated: GeneratedPolicy = {
    ...existing.generatedPolicy,
    companyName: updates.companyName ?? existing.companyName,
    websiteUrl: updates.websiteUrl ?? existing.websiteUrl,
    contactEmail: updates.contactEmail ?? existing.contactEmail,
    country: updates.country ?? existing.country,
    lastUpdated: lastUpdatedFormatted,
  };

  if (updates.markdown !== undefined) {
    updatedGenerated.markdown = updates.markdown;
    updatedGenerated.plainText = updates.markdown
      .replace(/#+\s*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  }

  if (updates.sections !== undefined) {
    updatedGenerated.sections = updates.sections;
  }

  let finalSlug = existing.slug;
  if (updates.slug && updates.slug.trim()) {
    const candidate = slugify(updates.slug);
    if (candidate === existing.slug || (await isSlugAvailable(candidate, existing.id))) {
      finalSlug = candidate;
    }
  }
  updatedGenerated.slug = finalSlug;

  const isPublished = updates.isPublished !== undefined ? updates.isPublished : existing.isPublished;
  const publishedAt = isPublished && !existing.publishedAt ? now : existing.publishedAt;

  const updatedRecord: StoredPolicyRecord = {
    ...existing,
    slug: finalSlug,
    companyName: updates.companyName ?? existing.companyName,
    websiteUrl: updates.websiteUrl ?? existing.websiteUrl,
    contactEmail: updates.contactEmail ?? existing.contactEmail,
    country: updates.country ?? existing.country,
    isPublished,
    publishedAt,
    generatedPolicy: updatedGenerated,
    formData: {
      ...(existing.formData || {}),
      is_published: isPublished,
      published_at: publishedAt,
    },
    updatedAt: now,
  };

  await upsertPolicyToSupabase(updatedRecord);
  updateLocalPolicy(updatedRecord);

  return updatedRecord;
}

export async function publishPolicy(id: string): Promise<StoredPolicyRecord | null> {
  return updatePolicyContent(id, { isPublished: true });
}

export async function getUserPolicies(userId: string): Promise<StoredPolicyRecord[]> {
  if (!userId) return [];
  const results: StoredPolicyRecord[] = [];
  const seenIds = new Set<string>();

  if (supabase) {
    try {
      const { data: colData } = await supabase
        .from("policies")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (colData && Array.isArray(colData)) {
        colData.forEach((row) => {
          const rec = mapRowToPolicyRecord(row);
          if (!seenIds.has(rec.id)) {
            seenIds.add(rec.id);
            results.push(rec);
          }
        });
      }
    } catch {}

    try {
      const { data: jsonbData } = await supabase
        .from("policies")
        .select("*")
        .order("created_at", { ascending: false });

      if (jsonbData && Array.isArray(jsonbData)) {
        jsonbData.forEach((row) => {
          const rec = mapRowToPolicyRecord(row);
          if (rec.userId === userId && !seenIds.has(rec.id)) {
            seenIds.add(rec.id);
            results.push(rec);
          }
        });
      }
    } catch {}
  }

  const local = readLocalPolicies();
  local.forEach((p) => {
    if ((p.userId === userId || p.formData?.user_id === userId) && !seenIds.has(p.id)) {
      seenIds.add(p.id);
      results.push(p);
    }
  });

  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

export interface DeployPolicyParams {
  formData?: PolicyFormData | any;
  generatedPolicy?: GeneratedPolicy;
  description?: string;
  requestedSlug?: string;
  editToken?: string;
  userId?: string;
}

export async function deployPolicy(
  params: DeployPolicyParams
): Promise<{ policy: StoredPolicyRecord; isNew: boolean }> {
  // If an editToken is provided, update existing
  if (params.editToken) {
    const existing = await getPolicyByEditToken(params.editToken);
    if (existing) {
      const updated = await updatePolicyContent(existing.id, {
        companyName: params.generatedPolicy?.companyName || existing.companyName,
        websiteUrl: params.generatedPolicy?.websiteUrl || existing.websiteUrl,
        contactEmail: params.generatedPolicy?.contactEmail || existing.contactEmail,
        country: params.generatedPolicy?.country || existing.country,
        markdown: params.generatedPolicy?.markdown,
        sections: params.generatedPolicy?.sections,
        slug: params.requestedSlug || existing.slug,
        isPublished: true,
      });
      return { policy: updated || existing, isNew: false };
    }
  }

  // Create or publish new policy
  let generated = params.generatedPolicy;
  if (!generated && params.description) {
    generated = generatePolicyFromDescription(params.description);
  } else if (!generated && params.formData) {
    generated = generatePrivacyPolicy(params.formData);
  }

  const preferredSlug =
    params.requestedSlug ||
    generated?.slug ||
    (generated?.companyName ? slugify(generated.companyName) : "app-privacy");

  const chosenSlug = await generateUniqueSlug(preferredSlug);

  const draft = await createDraftPolicy({
    description: params.description || "",
    userId: params.userId,
    generatedPolicy: generated,
    customSlug: chosenSlug,
  });

  const published = await updatePolicyContent(draft.id, {
    isPublished: true,
  });

  return { policy: published || draft, isNew: true };
}
