// app/api/auth/callback/route.ts
import "@shopify/shopify-api/adapters/node";
import { shopify } from "@/lib/shopify";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Make sure Node.js runtime is used

export async function GET(req: NextRequest) {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: new Response(),
    });

    const { session } = callbackResponse;
    //console.log("Session:", session);

    // Redirect user to the dashboard after successful OAuth
    const redirectUrl = `/dashboard?shop=${session.shop}&host=${req.nextUrl.searchParams.get("host")}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Auth Callback Error:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
