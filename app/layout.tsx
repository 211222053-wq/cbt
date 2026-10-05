import type { Metadata } from "next";

import { AppNav } from "@/components/nav";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "RyuExam CBT",
  description: "Computer Based Test platform for schools",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#e8f0fa] text-slate-900">
        <AppNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        <Providers />
      </body>
    </html>
  );
}
