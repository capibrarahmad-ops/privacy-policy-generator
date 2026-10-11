import { NextRequest, NextResponse } from "next/server";
import { getPolicyById, publishPolicy, getPolicyBySlug } from "@/lib/db";

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

    // Publish the policy
    const published = await publishPolicy(id);
    if (!published) {
      return NextResponse.json(
        { success: false, error: "Failed to publish policy to database." },
        { status: 500 }
      );
    }

    // Verify record is retrievable by slug
    const verifyRecord = await getPolicyBySlug(published.slug);
    if (!verifyRecord) {
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
    const liveUrl = `/p/${published.slug}`;
    const fullLiveUrl = `${proto}://${host}${liveUrl}`;

    return NextResponse.json({
      success: true,
      slug: published.slug,
      liveUrl,
      fullLiveUrl,
      companyName: published.companyName,
      lastUpdated: published.generatedPolicy.lastUpdated,
      publishedAt: published.publishedAt || published.updatedAt,
    });
  } catch (error: any) {
    console.error("Deploy policy API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to deploy policy. Please try again.",
      },
      { status: 500 }
    );
  }
}
