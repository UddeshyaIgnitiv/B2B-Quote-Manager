// app/api/auth/route.ts
import "@shopify/shopify-api/adapters/node";
import { shopify } from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Ensure the correct runtime

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const shop = searchParams.get("shop");

  if (!shop) {
    return NextResponse.json({ error: "Missing shop param" }, { status: 400 });
  }

  const callbackPath = "/api/auth/callback";

  try {
    const redirectUrl = await shopify.auth.begin({
      shop,
      callbackPath,
      isOnline: true,
      rawRequest: undefined
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error during auth.begin:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
