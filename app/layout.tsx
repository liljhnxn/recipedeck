import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "RecipeDeck — Good Food. Shared Stories.",
  description: "A decentralized culinary archive where home cooks and chefs publish their favourite recipes and explore meals shared by others on-chain.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-terracotta-200 selection:text-terracotta-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

