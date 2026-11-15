"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { useAuthStore, getDisplayName } from "@/lib/authStore";
import { useProfileQuery } from "@/lib/queries";

function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 프로필 페이지의 계정 정보 카드 (users/{uid} 문서)
 * - Google 계정(사진, 이메일), 가입일, 최근 로그인, 데이터 저장 경로, 로그아웃
 */
export function AccountCard() {
  const user = useAuthStore((s) => s.user);
  const userDoc = useAuthStore((s) => s.userDoc);
  const { data: profile } = useProfileQuery();
  const signOut = useAuthStore((s) => s.signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  const name = getDisplayName(profile, user);
  const photoURL = userDoc?.photoURL || user.photoURL || "";
  const rows = [
    { label: "가입일", value: userDoc ? formatDateTime(userDoc.createdAt) : "불러오는 중..." },
    { label: "최근 로그인", value: userDoc ? formatDateTime(userDoc.lastLoginAt) : "불러오는 중..." },
    { label: "데이터 저장 경로", value: `users/${user.uid}`, mono: true },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success("로그아웃되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast.error("로그아웃 중 문제가 발생했습니다.");
      setIsSigningOut(false);
    }
  };

  return (
    <section aria-labelledby="account-heading" className="rounded-[20px] bg-white border border-[#E5E8EF] p-5 sm:p-6 flex flex-col gap-4">
      <h2 id="account-heading" className="text-[15px] font-bold text-[#141A24]">
        계정
      </h2>

      <div className="flex items-center gap-3">
        {photoURL ? (
          <Image
            src={photoURL}
            alt=""
            width={40}
            height={40}
            unoptimized
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full border border-[#E5E8EF] shrink-0"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-[#EBF5FF] text-[#0078FF] font-bold flex items-center justify-center shrink-0">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#141A24] truncate">Google 계정</p>
          <p className="text-[13px] text-[#697383] truncate">{user.email}</p>
        </div>
      </div>

      <dl className="flex flex-col divide-y divide-[#F2F3F8] border-y border-[#F2F3F8]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-2.5 min-w-0">
            <dt className="text-[13px] text-[#99A1B1] shrink-0">{row.label}</dt>
            <dd
              className={`text-[13px] text-[#354153] truncate text-right ${row.mono ? "font-mono text-xs" : "font-medium"}`}
              title={row.value}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="self-start h-9 px-3.5 rounded-full border border-[#E5E8EF] text-[13px] font-semibold text-[#FF3A5B] hover:bg-[#FFF0F3] hover:border-[#FFD1DA] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
      >
        {isSigningOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {isSigningOut ? "로그아웃 중..." : "로그아웃"}
      </button>
    </section>
  );
}
