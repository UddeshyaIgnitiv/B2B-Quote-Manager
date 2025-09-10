// app/layout.tsx
import "./globals.css";
import { ReactNode, Suspense } from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "Shopify B2B Quote Manager",
  description: "Custom B2B Quote Manager app for Shopify",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
