"use client";

import React from "react";
import { MousePointerClick, Pencil, Trash2 } from "lucide-react";
import { LinkItem } from "@/types/link";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/icons";
import { CATEGORY_LABELS } from "@/lib/categories";

interface LinkRowProps {
  link: LinkItem;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
  onToggleActive: (link: LinkItem) => void;
}

/**
 * 링크 관리 목록의 한 줄
 * - 제목(누르면 새 탭으로 링크 열기), 클릭 수, 카테고리, 도메인, 대표/비공개 배지
 * - 클릭 수는 공개 페이지(/username) 방문자의 클릭만 집계 (실시간으로 갱신)
 * - 오른쪽: 공개 스위치, 수정, 삭제
 */
export function LinkRow({ link, onEdit, onDelete, onToggleActive }: LinkRowProps) {
  const isPrivate = !link.isActive;
  const domain = link.url.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  return (
    <li
      className={`flex items-center gap-3 rounded-[16px] border bg-white px-3.5 py-3 transition ${
        link.isFeatured ? "border-[#0078FF]/40" : "border-[#E5E8EF]"
      }`}
    >
      <span
        className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
          isPrivate ? "bg-[#F2F3F8] text-[#99A1B1]" : "bg-[#EBF5FF] text-[#0078FF]"
        }`}
      >
        <CategoryIcon category={link.category} icon={link.icon} className="w-[18px] h-[18px]" />
      </span>

      <div className={`flex-1 min-w-0 ${isPrivate ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-1.5 min-w-0">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[15px] font-semibold text-[#141A24] truncate hover:text-[#0078FF] hover:underline underline-offset-2"
            title={`${link.title} 열기`}
          >
            {link.title}
          </a>
          {link.isFeatured && (
            <span className="shrink-0 text-[10px] font-bold text-[#0078FF] bg-[#EBF5FF] px-1.5 py-0.5 rounded-full">
              대표
            </span>
          )}
          {isPrivate && (
            <span className="shrink-0 text-[10px] font-bold text-[#697383] bg-[#F2F3F8] px-1.5 py-0.5 rounded-full">
              비공개
            </span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1.5 min-w-0 text-xs text-[#99A1B1]">
          <span
            className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#F2F3F8] px-1.5 py-px font-semibold text-[#354153] tabular-nums"
            title={`클릭 ${(link.clickCount || 0).toLocaleString()}회`}
            aria-label={`클릭 ${link.clickCount || 0}회`}
          >
            <MousePointerClick className="w-3 h-3 text-[#0078FF]" aria-hidden="true" />
            {(link.clickCount || 0).toLocaleString()}
          </span>
          <span className="truncate">
            {CATEGORY_LABELS[link.category] ?? link.category}
            <span className="mx-1">·</span>
            {domain}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <Switch
          checked={link.isActive}
          onCheckedChange={() => onToggleActive(link)}
          aria-label={`${link.title} ${link.isActive ? "비공개로 전환" : "공개로 전환"}`}
          className="mr-1.5"
        />
        <button
          type="button"
          onClick={() => onEdit(link)}
          className="w-8 h-8 rounded-[9px] text-[#99A1B1] hover:text-[#141A24] hover:bg-[#F2F3F8] flex items-center justify-center transition cursor-pointer"
          aria-label={`${link.title} 수정`}
          title="수정"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(link)}
          className="w-8 h-8 rounded-[9px] text-[#99A1B1] hover:text-[#FF3A5B] hover:bg-[#FFF0F3] flex items-center justify-center transition cursor-pointer"
          aria-label={`${link.title} 삭제`}
          title="삭제"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
