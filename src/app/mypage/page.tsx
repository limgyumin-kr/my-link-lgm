"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { AppHeader } from "@/components/AppHeader";
import { ProfileEditCard } from "@/components/ProfileEditCard";
import { AccountCard } from "@/components/AccountCard";

/**
 * 프로필 페이지 (/mypage) - 로그인 상태 전용
 * - 프로필 수정 (username, 표시 이름, 소개글)
 * - 계정 정보 + 로그아웃
 * 로그인하지 않았으면 메인(/)으로 이동
 */
export default function ProfilePage() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (authStatus === "signedOut") router.replace("/");
  }, [authStatus, router]);

  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] flex flex-col">
      <AppHeader />
      <main className="max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {authStatus === "signedIn" ? (
          <>
            <div>
              <h1 className="text-xl font-bold text-[#141A24] tracking-tight">프로필</h1>
              <p className="mt-1 text-[13px] text-[#697383]">
                공개 페이지에 보이는 이름과 소개글, 주소(username)를 관리합니다.
              </p>
            </div>
            <ProfileEditCard />
            <AccountCard />
          </>
        ) : (
          // 로그인 상태 확인 중이거나 메인으로 이동 중
          <div className="flex flex-col gap-6" aria-busy="true">
            <div className="h-12 w-48 rounded-[12px] bg-white border border-[#E5E8EF] animate-pulse" />
            <div className="h-[420px] rounded-[20px] bg-white border border-[#E5E8EF] animate-pulse" />
          </div>
        )}
      </main>
    </div>
  );
}
