"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();

  const isAnalyzeActive = pathname === "/";
  const isHistoryActive = pathname.startsWith("/history");

  return (
    <header className="sticky top-0 z-30 h-[70px] border-b border-[#dbe8f4] bg-white/95 backdrop-blur-xs transition-colors">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 group shrink-0 focus:outline-none"
        >
          <Image
            src="/synthweb-logo.webp"
            alt="SynthWeb Logo"
            width={142}
            height={28}
            priority
            className="h-[24px] w-auto sm:h-[28px] object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
          <span className="hidden sm:inline-block text-[#c9ddef]">|</span>
          <span className="hidden sm:inline-block text-[13px] font-medium text-[#083251]/75 group-hover:text-[#137CC8] transition-colors duration-200">
            Resume Screener
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-[18px]">
          <Link
            href="/"
            className={`rounded-[4px] px-3 py-2 text-[13px] sm:text-[14px] leading-[20px] transition-all duration-200 ${
              isAnalyzeActive
                ? "bg-[#EAF3FC] text-[#137CC8] font-semibold"
                : "text-[#083251] font-medium hover:bg-[#EAF3FC]/50 hover:text-[#137CC8]"
            }`}
          >
            <span className="sm:hidden">Analyze</span>
            <span className="hidden sm:inline">Analyze Candidate</span>
          </Link>
          <Link
            href="/history"
            className={`rounded-[4px] px-3 py-2 text-[13px] sm:text-[14px] leading-[20px] transition-all duration-200 ${
              isHistoryActive
                ? "bg-[#EAF3FC] text-[#137CC8] font-semibold"
                : "text-[#083251] font-medium hover:bg-[#EAF3FC]/50 hover:text-[#137CC8]"
            }`}
          >
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Screening History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
