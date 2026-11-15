"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, getAuthErrorMessage } from "@/lib/authStore";
import { ProfileMenu } from "@/components/ProfileMenu";

/** Google 'G' 로고 (로그인 버튼용) */
export function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

interface AuthButtonProps {
  /** 로그인 버튼을 크게 표시 (안내 카드용) */
  size?: "sm" | "lg";
}

/**
 * 로그아웃 상태: "Google로 로그인" 버튼
 * 로그인 상태: 프로필 드롭다운 메뉴 ([사진 + 이름님 ▾] → 계정 정보, 페이지 이동, 로그아웃)
 */
export function AuthButton({ size = "sm" }: AuthButtonProps) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [isPending, setIsPending] = useState(false);

  const handleSignIn = async () => {
    setIsPending(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // 사용자가 팝업을 닫는 등 예상 가능한 실패가 대부분이므로 warn으로 기록 (Next 개발 오버레이 방지)
      console.warn("Google 로그인 실패:", (error as { code?: string })?.code ?? error);
      const msg = getAuthErrorMessage(error);
      if (msg) toast.error("로그인하지 못했습니다.", { description: msg });
    } finally {
      setIsPending(false);
    }
  };

  if (status === "loading") {
    return (
      <div
        className={`${size === "lg" ? "h-12 w-52 rounded-[14px]" : "h-8 w-24 rounded-full"} bg-[#F2F3F8] animate-pulse`}
        aria-hidden="true"
      />
    );
  }

  if (status === "signedOut" || !user) {
    const sizeClass =
      size === "lg"
        ? "h-12 px-6 text-[15px] rounded-[14px] gap-2.5 shadow-sm"
        : "h-8 px-3 text-[12px] rounded-full gap-1.5";
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isPending}
        className={`${sizeClass} bg-white border border-[#CBD1DC] text-[#141A24] hover:bg-[#F9F9FB] font-semibold flex items-center justify-center transition shadow-xs socar-press active:scale-[0.96] disabled:opacity-60 cursor-pointer whitespace-nowrap`}
      >
        {isPending ? (
          <Loader2 className={size === "lg" ? "w-4 h-4 animate-spin" : "w-3.5 h-3.5 animate-spin"} />
        ) : (
          <GoogleLogo className={size === "lg" ? "w-[18px] h-[18px]" : "w-3.5 h-3.5"} />
        )}
        <span>Google로 로그인</span>
      </button>
    );
  }

  // 로그인 상태: 프로필 드롭다운 메뉴 (계정 정보, 페이지 이동, 링크 관리, 로그아웃)
  return <ProfileMenu user={user} />;
}
