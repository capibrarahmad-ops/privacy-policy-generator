import { NextRequest, NextResponse } from "next/server";
import { deployPolicy, getPolicyByEditToken, isSlugAvailable } from "@/lib/db";
import { PolicyFormData } from "@/lib/generatePrivacyPolicy";

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
        { success: false, error: "Missing required company information." },
        { status: 400 }
      );
    }

    const { policy, isNew } = await deployPolicy({
      formData,
      requestedSlug,
      editToken,
    });

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const fullLiveUrl = `${protocol}://${host}/p/${policy.slug}`;

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
  } catch (error) {
    console.error("Deploy API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deploy privacy policy." },
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
      const found = getPolicyByEditToken(editToken);
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
      const available = isSlugAvailable(slug);
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
  } catch (error) {
    console.error("Check slug API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request." },
      { status: 500 }
    );
  }
}
