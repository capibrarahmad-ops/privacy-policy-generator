import { NextRequest, NextResponse } from "next/server";
import { deployPolicy, getPolicyByEditToken, isSlugAvailable } from "@/lib/db";
import { PolicyFormData } from "@/lib/generatePrivacyPolicy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, requestedSlug, editToken } = body as {
      formData: PolicyFormData;
      requestedSlug?: string;
      editToken?: string;
    };

    if (!formData || !formData.companyName || !formData.websiteUrl || !formData.contactEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required company information (Company name, Website URL, and Contact email are required).",
        },
        { status: 400 }
      );
    }

    const { policy, isNew } = await deployPolicy({
      formData,
      requestedSlug,
      editToken,
    });

    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "localhost:3000";
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host.includes("localhost") ? "http" : "https");
    const fullLiveUrl = `${proto}://${host}/p/${policy.slug}`;

    return NextResponse.json({
      success: true,
      isNew,
      slug: policy.slug,
      editToken: policy.editToken,
      liveUrl: `/p/${policy.slug}`,
      fullLiveUrl,
      companyName: policy.companyName,
      lastUpdated: policy.generatedPolicy.lastUpdated,
    });
  } catch (error: any) {
    console.error("Deploy API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to deploy privacy policy. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const editToken = searchParams.get("editToken");

    if (editToken) {
      const found = await getPolicyByEditToken(editToken);
      if (!found) {
        return NextResponse.json(
          { success: false, error: "Policy not found for this edit token." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        formData: found.formData,
        slug: found.slug,
        editToken: found.editToken,
      });
    }

    if (slug) {
      const available = await isSlugAvailable(slug);
      return NextResponse.json({
        success: true,
        slug,
        available,
      });
    }

    return NextResponse.json(
      { success: false, error: "Provide either a slug or editToken parameter." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Check slug API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
