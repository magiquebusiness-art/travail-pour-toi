import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NyXiaChatWidget from '@/components/nyxia-chat';

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NyXia MarketPlace — Votre Empire. Votre Liberté.",
  description:
    "Affichez vos produits, créez votre communauté d'ambassadeurs et gagnez sur 3 niveaux de commissions. La marketPlace premium pour entrepreneurs ambitieux.",
  keywords: [
    "marketplace",
    "vendeur",
    "ambassadeur",
    "commissions",
    "affiliation",
    "entrepreneuriat",
    "revenus",
    "community",
  ],
  authors: [{ name: "NyXia MarketPlace" }],
  icons: {
    icon: "/FavIcon.png",
    shortcut: { url: "/FavIcon.png", type: "image/png" },
    apple: { url: "/FavIcon.png" },
  },
  openGraph: {
    title: "NyXia MarketPlace — Votre Empire. Votre Liberté.",
    description:
      "Affichez vos produits, créez votre communauté d'ambassadeurs et gagnez sur 3 niveaux de commissions.",
    url: "https://travail-pour-toi.com",
    siteName: "NyXia MarketPlace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NyXia MarketPlace",
    description: "Votre MarketPlace. Votre Empire. Votre Liberté.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${outfit.variable} antialiased`}
      >
        {children}
        <Toaster />
        <NyXiaChatWidget />
      </body>
    </html>
  );
}
