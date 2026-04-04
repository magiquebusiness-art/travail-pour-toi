import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AffiliationPro - Ton Programme d'Affiliation en 5 Minutes",
  description: "Alternative à l'affiliation Systeme.io. Crée ton programme d'affiliation avec 3 niveaux de commissions (25%, 10%, 5%), dashboard complet et automatisation totale.",
  keywords: ["affiliation", "marketing", "commission", "systeme.io", "3 niveaux", "programme affilié", "automatisation"],
  authors: [{ name: "Publication-Web Cashflow" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "AffiliationPro - Ton Programme d'Affiliation en 5 Minutes",
    description: "Alternative à l'affiliation Systeme.io. Crée ton programme avec 3 niveaux de commissions.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
// Force deploy 1774654200
