import { NextRequest, NextResponse } from "next/server";
import { convertTextToMarkdown } from "@/lib/textToMarkdown";
import { createConvertedPolicyDraft } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawText, userId } = body as {
      rawText?: string;
      userId?: string;
    };

    const trimmed = (rawText || "").trim();

    // Strict input validation
    if (!trimmed) {
      return NextResponse.json(
        {
          success: false,
          error: "Please paste your privacy policy text before converting.",
        },
        { status: 400 }
      );
    }

    // Convert supplied user text into clean Markdown without AI or invented content
    const conversion = convertTextToMarkdown(trimmed);

    if (!conversion.markdown || !conversion.markdown.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to process the provided text. Please ensure valid text is supplied.",
        },
        { status: 400 }
      );
    }

    // Persist user's private draft in Supabase / resilient store
    const policyRecord = await createConvertedPolicyDraft({
      rawText: trimmed,
      markdown: conversion.markdown,
      title: conversion.title,
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      policyId: policyRecord.id,
      slug: policyRecord.slug,
      title: policyRecord.title,
      markdown: policyRecord.markdownContent,
      policy: policyRecord,
    });
  } catch (error: any) {
    console.error("Policy convert API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to convert and save privacy policy draft. Please try again.",
      },
      { status: 500 }
    );
  }
}
