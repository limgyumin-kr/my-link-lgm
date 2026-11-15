"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { AppHeader } from "@/components/AppHeader";
import { StatsDashboard } from "@/components/StatsDashboard";

/**
 * 통계 페이지 (/stats) - 로그인 상태 전용
 * - 총 클릭 수(모든 링크 합산), 링크별·카테고리별 클릭 차트, 클릭 순위
 * 로그인하지 않았으면 메인(/)으로 이동
 */
export default function StatsPage() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (authStatus === "signedOut") router.replace("/");
  }, [authStatus, router]);

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] flex flex-col">
      <AppHeader />
      <main className="max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#141A24] tracking-tight">통계</h1>
          <p className="mt-1 text-[13px] text-[#697383]">
            공개 페이지 방문자가 링크를 누른 횟수입니다.
          </p>
        </div>
        {authStatus === "signedIn" ? (
          <StatsDashboard />
        ) : (
          // 로그인 상태 확인 중이거나 메인으로 이동 중
          <div className="flex flex-col gap-4" aria-busy="true">
            <div className="h-36 rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
            <div className="h-72 rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
          </div>
        )}
      </main>
    </div>
  );
}
