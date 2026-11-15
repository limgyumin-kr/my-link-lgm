"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useAuthStore, getDisplayName, getDefaultUsername } from "@/lib/authStore";
import { useProfileQuery, useLinksQuery } from "@/lib/queries";
import { getPublicUrl, getPublicUrlLabel } from "@/lib/publicUrl";

/**
 * 링크 관리 화면 상단 "내 페이지" 요약 카드
 * - 프로필(이름, @username, 소개글)
 * - 공개 페이지 주소 복사 / 새 탭으로 열기
 * - 링크 통계 (전체 / 공개 / 총 클릭 - 공개 페이지 방문자의 링크 클릭 합계)
 */
export function MyPageCard() {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfileQuery();
  const linksQuery = useLinksQuery();
  const links = linksQuery.data ?? [];
  const linksStatus = linksQuery.isSuccess ? "ready" : linksQuery.isError ? "error" : "loading";
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const name = getDisplayName(profile, user);
  const username = profile?.username ?? getDefaultUsername(user);
  const ready = linksStatus === "ready";
  const stats = [
    { label: "전체 링크", value: links.length },
    { label: "공개 중", value: links.filter((l) => l.isActive).length },
    { label: "총 클릭", value: links.reduce((sum, l) => sum + (l.clickCount || 0), 0) },
  ];

  const handleCopy = async () => {
    const url = getPublicUrl(username);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("내 페이지 링크가 복사되었습니다.", { description: url });
    } catch {
      toast.error("클립보드 복사에 실패했습니다.", {
        description: "브라우저의 클립보드 권한을 확인해주세요.",
      });
    }
  };

  return (
    <section className="rounded-[20px] bg-white border border-[#E5E8EF] p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={56}
            height={56}
            unoptimized
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full border border-[#E5E8EF] shrink-0"
          />
        ) : (
          <span className="w-14 h-14 rounded-full bg-[#EBF5FF] text-[#0078FF] text-xl font-bold flex items-center justify-center shrink-0">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[#141A24] tracking-tight truncate">{name}</h1>
          <p className="text-[13px] font-semibold text-[#0078FF] truncate">@{username}</p>
          {profile?.bio ? (
            <p className="mt-1 text-[13px] text-[#697383] line-clamp-2">{profile.bio}</p>
          ) : null}
        </div>
      </div>

      {/* 공개 페이지 주소 */}
      <div className="flex items-center gap-2 rounded-[12px] bg-[#F5F6F8] pl-3.5 pr-1.5 h-11">
        <span className="flex-1 min-w-0 truncate font-mono text-[13px] text-[#354153]">
          {getPublicUrlLabel(username)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="h-8 px-2.5 rounded-[9px] bg-white border border-[#E5E8EF] text-[12px] font-semibold text-[#354153] hover:border-[#CBD1DC] flex items-center gap-1 transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#04CA81]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "복사됨" : "복사"}</span>
        </button>
        <a
          href={getPublicUrl(username)}
          target="_blank"
          rel="noopener noreferrer"
          className="h-8 px-2.5 rounded-[9px] bg-[#0078FF] text-white text-[12px] font-semibold hover:bg-[#0066DB] flex items-center gap-1 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>열기</span>
        </a>
      </div>

      {/* 통계 */}
      <dl className="grid grid-cols-3 divide-x divide-[#F2F3F8]">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <dt className="text-[11px] text-[#99A1B1]">{s.label}</dt>
            <dd className="text-lg font-bold text-[#141A24] tabular-nums">{ready ? s.value.toLocaleString() : "-"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
