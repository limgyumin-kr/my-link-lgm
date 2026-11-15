import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSync } from "@/components/AuthSync";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyLink - 나만의 링크 페이지",
  description: "포트폴리오, 블로그, SNS 링크를 한 페이지에 모아 나만의 주소로 공유하세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* TanStack Query (프로필/링크 캐시) */}
        <QueryProvider>
          <AuthSync />
          {children}
        </QueryProvider>
        {/* 전역 토스트 (sonner, 중앙 상단) */}
        <Toaster />
      </body>
    </html>
  );
}
