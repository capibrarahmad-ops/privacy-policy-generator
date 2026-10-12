import { NextRequest, NextResponse } from "next/server";
import { getPolicyById, updatePolicyContent } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing policy ID." },
        { status: 400 }
      );
    }

    const policy = await getPolicyById(id);
    if (!policy) {
      return NextResponse.json(
        { success: false, error: "Policy not found." },
        { status: 404 }
      );
    }

    // Ownership check: if userId query param is provided and policy has userId, verify ownership
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get("userId");
    if (requestingUserId && policy.userId && policy.userId !== requestingUserId && !policy.isPublished) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to private draft." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (error: any) {
    console.error("Get policy API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to retrieve policy." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const {
      markdown,
      rawContent,
      title,
      sections,
      companyName,
      websiteUrl,
      contactEmail,
      country,
      isPublished,
      slug,
      userId,
    } = body;

    // Verify owner if policy belongs to a user
    if (existing.userId && userId && existing.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to edit this policy." },
        { status: 403 }
      );
    }

    const updated = await updatePolicyContent(id, {
      markdown,
      rawContent,
      title: title || companyName,
      sections,
      companyName: companyName || title,
      websiteUrl,
      contactEmail,
      country,
      isPublished,
      slug,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Policy not found or could not be updated." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      policy: updated,
    });
  } catch (error: any) {
    console.error("Update policy API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update policy." },
      { status: 500 }
    );
  }
}
