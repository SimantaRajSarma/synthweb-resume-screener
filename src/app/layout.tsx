import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans, Inter_Tight } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SynthWeb | AI Resume Screener",
  description:
    "Structured candidate screening assistant built with SynthWeb Bluewave design, Claude & Gemini AI, Zod validation, and SQLite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${interTight.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-white text-[#083251]">
        <NavBar />

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-[24px] sm:px-6 sm:py-[36px]">
          {children}
        </main>

        {/* Dark Navy Anchor Band per SynthWeb Bluewave spec */}
        <footer className="bg-[#083251] text-white py-[24px] mt-[40px] sm:mt-[60px]">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 text-center text-[12px] leading-[18px] sm:px-6 md:flex-row md:text-left">
            <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:gap-3.5">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/synthweb-logo.webp"
                  alt="SynthWeb Logo"
                  width={126}
                  height={24}
                  className="h-[22px] w-auto object-contain"
                />
              </Link>
              <span className="hidden sm:inline text-white/30">|</span>
              <span className="text-white/80 font-medium">
                AI Resume Screener Assistant
              </span>
            </div>

            <div className="text-white/70">
              Claude / Gemini Structured Output &bull; Zod Schema Enforcement &bull;
              Prompt-Injection Guard
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
