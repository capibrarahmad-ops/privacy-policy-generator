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

    const body = await request.json();
    const {
      markdown,
      sections,
      companyName,
      websiteUrl,
      contactEmail,
      country,
      isPublished,
      slug,
    } = body;

    const updated = await updatePolicyContent(id, {
      markdown,
      sections,
      companyName,
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
