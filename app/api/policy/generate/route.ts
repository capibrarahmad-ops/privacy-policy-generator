import { NextRequest, NextResponse } from "next/server";
import { convertTextToMarkdown } from "@/lib/textToMarkdown";
import { createConvertedPolicyDraft } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, rawText, userId } = body as {
      description?: string;
      rawText?: string;
      userId?: string;
    };

    const textToProcess = (rawText || description || "").trim();

    if (!textToProcess) {
      return NextResponse.json(
        { success: false, error: "Please paste your privacy policy text before converting." },
        { status: 400 }
      );
    }

    // Convert supplied user text into clean Markdown without AI or invented templates
    const conversion = convertTextToMarkdown(textToProcess);

    const policyRecord = await createConvertedPolicyDraft({
      rawText: textToProcess,
      markdown: conversion.markdown,
      title: conversion.title,
      userId: userId || undefined,
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
        error: error?.message || "Failed to process and save policy draft. Please try again.",
      },
      { status: 500 }
    );
  }
}
