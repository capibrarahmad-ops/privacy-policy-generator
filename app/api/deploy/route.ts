import { NextRequest, NextResponse } from "next/server";
import { deployPolicy, getPolicyByEditToken, getPolicyBySlug, isSlugAvailable } from "@/lib/db";
import { PolicyFormData, GeneratedPolicy } from "@/lib/generatePrivacyPolicy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, generatedPolicy, description, requestedSlug, editToken } = body as {
      formData?: PolicyFormData | any;
      generatedPolicy?: GeneratedPolicy;
      description?: string;
      requestedSlug?: string;
      editToken?: string;
    };

    if (!formData && !generatedPolicy && !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing policy content. Please enter your app description or provide policy data to deploy.",
        },
        { status: 400 }
      );
    }

    const { policy, isNew } = await deployPolicy({
      formData,
      generatedPolicy,
      description,
      requestedSlug,
      editToken,
    });

    // Verify policy actually exists and is retrievable
    const verifyRecord = await getPolicyBySlug(policy.slug);
    if (!verifyRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Deployment verification failed: policy could not be confirmed in storage.",
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
