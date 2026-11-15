"use client";

import React from "react";
import { AuthButton } from "@/components/AuthButton";

/**
 * 로그아웃 상태의 메인 페이지 (최소 기능)
 * - 서비스 한 줄 소개 + Google 로그인 버튼만 제공
 */
export function Landing() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="w-14 h-14 rounded-[16px] bg-[#0078FF] text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-[0_8px_24px_rgba(0,120,255,0.25)]"
        >
          ML
        </span>

        <h1 className="mt-7 text-[28px] sm:text-[32px] leading-tight font-bold text-[#141A24] tracking-tight">
          흩어진 링크를
          <br />
          한 페이지에 모아보세요
        </h1>
        <p className="mt-3 text-[15px] text-[#697383] leading-relaxed">
          포트폴리오, 블로그, SNS 링크를 정리하고
          <br className="hidden min-[400px]:inline" /> 나만의 주소 하나로 공유할 수 있어요.
        </p>

        <div className="mt-8">
          <AuthButton size="lg" />
        </div>

        <p className="mt-4 text-xs text-[#99A1B1]">
          로그인하면 <span className="font-mono text-[#697383]">mylink/내아이디</span> 페이지가 바로 만들어져요.
        </p>
      </div>
    </main>
  );
}
