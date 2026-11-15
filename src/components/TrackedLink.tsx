"use client";

import React from "react";
import { incrementLinkClick } from "@/lib/firestoreLinks";

interface TrackedLinkProps {
  /** 링크 소유자 uid (users/{uid}/links/{linkId}) */
  ownerUid: string;
  linkId: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * 공개 페이지의 링크 버튼: 클릭하면 새 탭으로 열고, 클릭 수(clickCount)를 +1 저장
 * - 일반 클릭, Ctrl/⌘+클릭, 가운데 버튼 클릭(새 탭)을 모두 집계
 * - 저장은 기다리지 않음(링크 이동을 막지 않음). 실패해도 링크는 열린다.
 */
export function TrackedLink({ ownerUid, linkId, href, className, children }: TrackedLinkProps) {
  const record = () => {
    incrementLinkClick(ownerUid, linkId).catch((error) => {
      console.warn("클릭 수 저장 실패:", (error as { code?: string })?.code ?? error);
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={record}
      onAuxClick={(e) => {
        // 가운데 버튼(휠 클릭)으로 새 탭에서 연 경우
        if (e.button === 1) record();
      }}
    >
      {children}
    </a>
  );
}
