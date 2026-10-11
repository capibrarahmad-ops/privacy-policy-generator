import { NextRequest, NextResponse } from "next/server";
import { getUserPolicies } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter." },
        { status: 400 }
      );
    }

    const policies = await getUserPolicies(userId);

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error: any) {
    console.error("User policies API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to load user policies." },
      { status: 500 }
    );
  }
}
