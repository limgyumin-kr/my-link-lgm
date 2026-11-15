"use client";

import React from "react";
import { useAuthStore } from "@/lib/authStore";
import { AppHeader } from "@/components/AppHeader";
import { Landing } from "@/components/Landing";
import { LinkDashboard } from "@/components/LinkDashboard";

/**
 * 메인 페이지 (/)
 * - 로그아웃 상태: 서비스 소개 + Google 로그인 (Landing)
 * - 로그인 상태: 링크 관리 (LinkDashboard)
 * 로그인 상태 감지(onAuthStateChanged)는 layout의 AuthSync에서 처리
 */
export default function HomePage() {
  const authStatus = useAuthStore((s) => s.status);

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] flex flex-col">
      <AppHeader />
      {authStatus === "loading" ? (
        <HomeSkeleton />
      ) : authStatus === "signedIn" ? (
        <LinkDashboard />
      ) : (
        <Landing />
      )}
    </div>
  );
}

/** 로그인 상태 확인 중 뼈대 */
function HomeSkeleton() {
  return (
    <main className="max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-6" aria-busy="true">
      <div className="h-[220px] rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[66px] rounded-[16px] bg-white border border-[#E5E8EF] animate-pulse" />
        ))}
      </div>
    </main>
  );
}
