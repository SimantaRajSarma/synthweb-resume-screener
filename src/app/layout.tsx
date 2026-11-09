import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Screener Assistant",
  description:
    "Screen candidate resumes against job descriptions with structured Gemini AI evaluation, Zod validation, and SQLite history.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-sm group-hover:bg-indigo-700 transition-colors">
                RS
              </div>
              <div>
                <span className="font-semibold text-slate-900 tracking-tight block leading-none">
                  Resume Screener
                </span>
                <span className="text-xs text-slate-500">
                  Gemini + Zod + SQLite
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Analyze Resume
              </Link>
              <Link
                href="/history"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Screening History
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          AI Resume Screener Assistant &bull; Structured Evaluation with Prompt-Injection Defense
        </footer>
      </body>
    </html>
  );
}
