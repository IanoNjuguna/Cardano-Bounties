import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Cardano Bounties - Learn, Contribute & Earn on Cardano",
  description:
    "An open platform where anyone regardless of experience or skill level can contribute to the Cardano ecosystem. Explore tasks, build in public, and earn ADA while contributing to real projects.",
  openGraph: {
    images: [
      {
        url: "/og-image.png",
        alt: "Cardano Bounties platform - open bounties for the Cardano ecosystem",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
