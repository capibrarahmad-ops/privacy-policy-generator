import { NextRequest, NextResponse } from "next/server";
import { getPolicyById, updatePolicyContent, getPolicyBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing policy ID." },
        { status: 400 }
      );
    }

    const existing = await getPolicyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Policy not found." },
        { status: 404 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const { markdown, title, userId } = body;

    // Verify owner permissions if user_id is assigned
    if (existing.userId && userId && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: only the owner can publish this policy." },
        { status: 403 }
      );
    }

    // Save latest Markdown content and mark as published
    const updated = await updatePolicyContent(id, {
      markdown: markdown !== undefined ? markdown : existing.markdownContent || existing.generatedPolicy?.markdown,
      title: title || existing.title || existing.companyName,
      isPublished: true,
    });

    if (!updated || !updated.isPublished) {
      return NextResponse.json(
        { success: false, error: "Failed to persist publication status in database." },
        { status: 500 }
      );
    }

    // Explicit Verification: Do not claim deployment succeeded until saving succeeds and public record is accessible
    const verifiedRecord = await getPolicyBySlug(updated.slug, false, true);
    if (!verifiedRecord || !verifiedRecord.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: "Publication verification failed: could not confirm published status in storage.",
        },
        { status: 500 }
      );
    }

    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");

    const liveUrl = `/p/${updated.slug}`;
    const fullLiveUrl = `${proto}://${host}${liveUrl}`;

    return NextResponse.json({
      success: true,
      slug: updated.slug,
      title: updated.title || updated.companyName,
      liveUrl,
      fullLiveUrl,
      publishedAt: updated.publishedAt || updated.updatedAt,
      isPublished: true,
      message: "Privacy policy successfully published and accessible.",
    });
  } catch (error: any) {
    console.error("Deploy policy API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to deploy privacy policy. Please try again.",
      },
      { status: 500 }
    );
  }
}
