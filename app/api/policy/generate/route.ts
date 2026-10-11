import { NextRequest, NextResponse } from "next/server";
import { createDraftPolicy } from "@/lib/db";
import { generatePolicyFromDescription } from "@/lib/generatePrivacyPolicy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, userId } = body as {
      description?: string;
      userId?: string;
    };

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter a description of your app or website." },
        { status: 400 }
      );
    }

    if (description.trim().length < 15) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a slightly more descriptive summary (at least 15 characters).",
        },
        { status: 400 }
      );
    }

    // Generate the privacy policy from description
    const generated = generatePolicyFromDescription(description.trim());

    // Persist as draft in database (Supabase + resilient local store)
    const policyRecord = await createDraftPolicy({
      description: description.trim(),
      userId: userId || undefined,
      generatedPolicy: generated,
    });

    return NextResponse.json({
      success: true,
      policyId: policyRecord.id,
      slug: policyRecord.slug,
      policy: policyRecord,
    });
  } catch (error: any) {
    console.error("Policy generate API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate and save policy draft. Please try again.",
      },
      { status: 500 }
    );
  }
}
