// app/providers.tsx
"use client";

import React, { createContext, ReactNode, useContext, useMemo } from "react";
import createApp from "@shopify/app-bridge";
import { useSearchParams } from "next/navigation";

interface AppBridgeContextValue {
  app: ReturnType<typeof createApp> | null;
}

const AppBridgeContext = createContext<AppBridgeContextValue>({ app: null });

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const searchParams = useSearchParams();
  const host = searchParams.get("host") ?? "";

  const app = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SHOPIFY_API_KEY) {
      throw new Error("Missing NEXT_PUBLIC_SHOPIFY_API_KEY");
    }

    if (!host) {
      return null;
    }

    return createApp({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
      host,
      forceRedirect: true,
    });
  }, [host]);

  if (!app) return null;

  return (
    <AppBridgeContext.Provider value={{ app }}>
      {children}
    </AppBridgeContext.Provider>
  );
}

export function useAppBridge() {
  return useContext(AppBridgeContext).app;
}
