import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { withBasePath } from "@/lib/site/paths";
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
  title: "Kotoba AI Cards",
  description: "AI vocabulary cards for CET-4, CET-6, and JLPT N5-N1 learners.",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: withBasePath("/kotoba-icon.svg"),
    apple: withBasePath("/kotoba-icon-192.png"),
  },
  appleWebApp: {
    capable: true,
    title: "Kotoba",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f2ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
