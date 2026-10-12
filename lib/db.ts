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
import { extractTitleFromMarkdown } from "./textToMarkdown";

export interface StoredPolicyRecord {
  id: string;
  slug: string;
  userId?: string;
  title?: string;
  description?: string;
  rawContent?: string;
  markdownContent?: string;
  isPublished?: boolean;
  publishedAt?: string;
  companyName: string;
  websiteUrl: string;
  contactEmail: string;
  country: string;
  editToken: string;
  formData: PolicyFormData | any;
  generatedPolicy: GeneratedPolicy | any;
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

  const rawContent = row.raw_content || formData?.raw_content || formData?.original_input || row.description || "";
  const markdownContent = row.markdown_content || generatedPolicy?.markdown || formData?.markdown_content || "";
  const title = row.title || row.company_name || formData?.title || generatedPolicy?.title || generatedPolicy?.companyName || "Privacy Policy";

  return {
    id: String(row.id),
    slug: String(row.slug),
    userId: row.user_id || formData?.user_id || undefined,
    title,
    description: row.description || rawContent || "",
    rawContent,
    markdownContent,
    isPublished: typeof row.is_published === "boolean" ? row.is_published : Boolean(formData?.is_published),
    publishedAt: row.published_at || formData?.published_at || undefined,
    companyName: row.company_name || title,
    websiteUrl: row.website_url || row.websiteUrl || generatedPolicy?.websiteUrl || "",
    contactEmail: row.contact_email || row.contactEmail || generatedPolicy?.contactEmail || "",
    country: row.country || generatedPolicy?.country || "Worldwide",
    editToken: row.edit_token || row.editToken || "",
    formData,
    generatedPolicy: {
      ...generatedPolicy,
      title,
      companyName: title,
      markdown: markdownContent || generatedPolicy?.markdown || "",
      lastUpdated: row.published_at || row.updated_at || generatedPolicy?.lastUpdated || new Date().toISOString(),
    },
    views: typeof row.views === "number" ? row.views : 0,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

async function upsertPolicyToSupabase(record: StoredPolicyRecord): Promise<{ error: any }> {
  if (!supabase) return { error: null };

  const markdown = record.markdownContent || record.generatedPolicy?.markdown || "";
  const rawText = record.rawContent || record.description || "";
  const title = record.title || record.companyName || "Privacy Policy";

  const fullRow = {
    id: record.id,
    slug: record.slug,
    user_id: record.userId || null,
    title,
    company_name: title,
    website_url: record.websiteUrl || "",
    contact_email: record.contactEmail || "",
    country: record.country || "Worldwide",
    edit_token: record.editToken || "",
    raw_content: rawText,
    markdown_content: markdown,
    description: rawText,
    is_published: Boolean(record.isPublished),
    published_at: record.publishedAt || null,
    form_data: {
      ...(record.formData || {}),
      raw_content: rawText,
      markdown_content: markdown,
      original_input: rawText,
      title,
      user_id: record.userId,
      is_published: Boolean(record.isPublished),
      published_at: record.publishedAt,
    },
    generated_policy: {
      ...(record.generatedPolicy || {}),
      markdown,
      title,
      companyName: title,
      lastUpdated: record.publishedAt || record.updatedAt || new Date().toISOString(),
    },
    views: record.views || 0,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };

  try {
    // 1. Attempt upsert with all extended columns (if migration has run)
    const { error } = await supabase.from("policies").upsert(fullRow, { onConflict: "id" });
    if (!error) return { error: null };

    // 2. If new columns (e.g. raw_content, markdown_content, title) are not in DB, fallback to existing columns
    if (error.code === "42703" || error.message?.includes("column")) {
      const baseRow = {
        id: record.id,
        slug: record.slug,
        company_name: title,
        website_url: record.websiteUrl || "",
        contact_email: record.contactEmail || "",
        country: record.country || "Worldwide",
        edit_token: record.editToken || "",
        form_data: fullRow.form_data,
        generated_policy: fullRow.generated_policy,
        user_id: record.userId || null,
        description: rawText,
        is_published: Boolean(record.isPublished),
        published_at: record.publishedAt || null,
        views: record.views || 0,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      };
      const { error: baseError } = await supabase.from("policies").upsert(baseRow, { onConflict: "id" });
      if (!baseError) return { error: null };

      // 3. Fallback to minimal base table schema if user_id or is_published is missing
      const minimalRow = {
        id: record.id,
        slug: record.slug,
        company_name: title,
        website_url: record.websiteUrl || "",
        contact_email: record.contactEmail || "",
        country: record.country || "Worldwide",
        edit_token: record.editToken || "",
        form_data: fullRow.form_data,
        generated_policy: fullRow.generated_policy,
        views: record.views || 0,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      };
      return await supabase.from("policies").upsert(minimalRow, { onConflict: "id" });
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
  const base = slugify(preferred || "privacy-policy");
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-policy` : base;
  let counter = 1;

  while (!(await isSlugAvailable(candidate))) {
    counter++;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

/**
 * Creates a private draft policy from converted user Markdown and original text.
 * Strictly preserves the user's supplied text and Markdown without AI or template generation.
 */
export interface CreateConvertedPolicyParams {
  id?: string;
  rawText: string;
  markdown: string;
  title?: string;
  userId?: string;
  customSlug?: string;
}

export async function createConvertedPolicyDraft(
  params: CreateConvertedPolicyParams
): Promise<StoredPolicyRecord> {
  const now = new Date().toISOString();
  const id = params.id || crypto.randomUUID();

  const title = params.title || extractTitleFromMarkdown(params.markdown) || "Privacy Policy";
  const preferredSlug = params.customSlug || slugify(title) || "privacy-policy";
  const chosenSlug = await generateUniqueSlug(preferredSlug);
  const editToken = crypto.randomBytes(24).toString("hex");

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const record: StoredPolicyRecord = {
    id,
    slug: chosenSlug,
    userId: params.userId,
    title,
    companyName: title,
    websiteUrl: "",
    contactEmail: "",
    country: "Worldwide",
    editToken,
    rawContent: params.rawText,
    markdownContent: params.markdown,
    description: params.rawText,
    isPublished: false,
    formData: {
      original_input: params.rawText,
      raw_content: params.rawText,
      markdown_content: params.markdown,
      title,
      user_id: params.userId,
      is_published: false,
    },
    generatedPolicy: {
      title,
      companyName: title,
      markdown: params.markdown,
      sections: [],
      websiteUrl: "",
      contactEmail: "",
      country: "Worldwide",
      lastUpdated: formattedDate,
    },
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  await upsertPolicyToSupabase(record);
  saveLocalPolicy(record);

  return record;
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
      : "Privacy Policy";

  const preferredSlug =
    params.customSlug ||
    (generated.slug && !generated.slug.includes("needs-confirmation") ? generated.slug : "") ||
    (companyName !== "Privacy Policy" ? slugify(companyName) : "privacy-policy");

  const chosenSlug = await generateUniqueSlug(preferredSlug);
  generated.slug = chosenSlug;

  const editToken = crypto.randomBytes(24).toString("hex");

  const record: StoredPolicyRecord = {
    id,
    slug: chosenSlug,
    userId: params.userId,
    title: companyName,
    companyName,
    websiteUrl: generated.websiteUrl || "",
    contactEmail: generated.contactEmail || "",
    country: generated.country || "Worldwide",
    editToken,
    rawContent: params.description,
    markdownContent: generated.markdown || "",
    description: params.description,
    isPublished: false,
    formData: {
      description: params.description,
      raw_content: params.description,
      markdown_content: generated.markdown || "",
      user_id: params.userId,
      is_published: false,
    },
    generatedPolicy: generated,
    views: 0,
    createdAt: now,
    updatedAt: now,
  };

  await upsertPolicyToSupabase(record);
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
    rawContent?: string;
    title?: string;
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

  const updatedTitle = updates.title || updates.companyName || existing.title || existing.companyName;

  const updatedGenerated: GeneratedPolicy = {
    ...existing.generatedPolicy,
    title: updatedTitle,
    companyName: updatedTitle,
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
  const rawContent = updates.rawContent ?? existing.rawContent;
  const markdownContent = updates.markdown ?? existing.markdownContent;

  const updatedRecord: StoredPolicyRecord = {
    ...existing,
    slug: finalSlug,
    title: updatedTitle,
    companyName: updatedTitle,
    websiteUrl: updates.websiteUrl ?? existing.websiteUrl,
    contactEmail: updates.contactEmail ?? existing.contactEmail,
    country: updates.country ?? existing.country,
    rawContent,
    markdownContent,
    isPublished,
    publishedAt,
    generatedPolicy: updatedGenerated,
    formData: {
      ...(existing.formData || {}),
      raw_content: rawContent,
      markdown_content: markdownContent,
      title: updatedTitle,
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
  incrementView = false,
  publicOnly = false
): Promise<StoredPolicyRecord | null> {
  const normalized = slugify(slug);
  if (!normalized) return null;

  if (supabase) {
    try {
      let query = supabase.from("policies").select("*").eq("slug", normalized);
      if (publicOnly) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const record = mapRowToPolicyRecord(data);
        if (publicOnly && !record.isPublished) {
          return null;
        }
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

  if (publicOnly && !found.isPublished) {
    return null;
  }

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

  let generated = params.generatedPolicy;
  if (!generated && params.description) {
    generated = generatePolicyFromDescription(params.description);
  } else if (!generated && params.formData) {
    generated = generatePrivacyPolicy(params.formData);
  }

  const preferredSlug =
    params.requestedSlug ||
    generated?.slug ||
    (generated?.companyName ? slugify(generated.companyName) : "privacy-policy");

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
