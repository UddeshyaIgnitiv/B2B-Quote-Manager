// lib/shopify.ts
import "@shopify/shopify-api/adapters/node"; // Required for Node.js

import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import { InMemorySessionStorage } from "./sessionStorage";

export const sessionStorage = new InMemorySessionStorage();

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SHOPIFY_SCOPES!.split(","),
  hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ""),
  isEmbeddedApp: true,
  apiVersion: LATEST_API_VERSION,
  sessionStorage,
});
