"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { AuthButton } from "@/components/AuthButton";

const NAV_ITEMS = [
  { href: "/", label: "링크" },
  { href: "/stats", label: "통계" },
  { href: "/mypage", label: "프로필" },
] as const;

/**
 * 모든 페이지 공통 헤더
 * - 왼쪽: 로고 (홈으로)
 * - 가운데: 로그인 시 [링크 | 통계 | 프로필] 탭
 * - 오른쪽: 로그아웃 상태면 "Google로 로그인", 로그인 상태면 프로필 메뉴
 */
export function AppHeader() {
  const pathname = usePathname();
  const isSignedIn = useAuthStore((s) => s.status === "signedIn");

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-[#E5E8EF]">
      <div className="max-w-2xl mx-auto h-14 px-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="MyLink 홈">
          <span className="w-7 h-7 rounded-[8px] bg-[#0078FF] text-white flex items-center justify-center font-black text-[11px] tracking-tighter">
            ML
          </span>
          <span className="font-bold text-[17px] text-[#141A24] tracking-tight hidden min-[360px]:inline">
            MyLink
          </span>
        </Link>

        {isSignedIn && (
          <nav aria-label="주요 메뉴" className="flex items-center gap-0.5 sm:gap-1 ml-0.5 sm:ml-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`h-8 px-2.5 sm:px-3 rounded-full text-[13px] font-semibold flex items-center transition ${
                    active
                      ? "bg-[#141A24] text-white"
                      : "text-[#697383] hover:text-[#141A24] hover:bg-[#F2F3F8]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center min-w-0">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
