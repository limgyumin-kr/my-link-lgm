"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LinkItem, LinkCategory } from "@/types/link";
import { validateUrl, normalizeUrl } from "@/lib/url";
import { CategoryIcon } from "@/components/icons";
import { LINK_CATEGORIES, DEFAULT_CATEGORY, normalizeCategory } from "@/lib/categories";
import { AlertCircle } from "lucide-react";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    url: string;
    category: LinkCategory;
    icon?: string;
    isActive: boolean;
    isFeatured?: boolean;
  }) => void | Promise<void>;
  initialData?: LinkItem | null;
  buttonColor?: string;
}

const CATEGORIES = LINK_CATEGORIES;

export function LinkModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  buttonColor = "#0078FF",
}: LinkModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [rawUrl, setRawUrl] = useState(initialData?.url ?? "");
  const [category, setCategory] = useState<LinkCategory>(initialData ? normalizeCategory(initialData.category) : DEFAULT_CATEGORY);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 필드별 유효성 검사 에러 상태
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  // 모달이 열리고 닫히거나 편집 대상이 바뀌면 폼을 초기화한다.
  // useEffect에서 setState를 호출하는 대신, 렌더 중에 이전 props와 비교해 즉시 갱신하는
  // React 권장 패턴 사용 (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevProps, setPrevProps] = useState({ isOpen, initialData });
  if (prevProps.isOpen !== isOpen || prevProps.initialData !== initialData) {
    setPrevProps({ isOpen, initialData });
    setIsSubmitting(false);
    setTitle(initialData?.title ?? "");
    setDescription(initialData?.description ?? "");
    setRawUrl(initialData?.url ?? "");
    setCategory(initialData ? normalizeCategory(initialData.category) : DEFAULT_CATEGORY);
    setIsActive(initialData?.isActive ?? true);
    setIsFeatured(Boolean(initialData?.isFeatured));
    setErrors({});
  }

  // URL 입력란 포커스 아웃 시 자동 정규화 및 검증
  const handleUrlBlur = () => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return;
    }
    const normalized = normalizeUrl(trimmed);
    setRawUrl(normalized);
    const validation = validateUrl(normalized);
    if (!validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        url: validation.errorMessage || "올바른 URL 형식(예: https://example.com)을 입력해주세요.",
      }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.url;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: { title?: string; url?: string } = {};

    // 1. 제목 빈칸 검증
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = "제목을 입력해주세요. (빈칸 불가)";
    }

    // 2. 주소 빈칸 및 형식 검증
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
      newErrors.url = "웹 주소(URL)를 입력해주세요. (빈칸 불가)";
    } else {
      const validation = validateUrl(trimmedUrl);
      if (!validation.isValid) {
        newErrors.url = validation.errorMessage || "올바른 URL 형식을 입력해주세요.";
      }
    }

    // 에러가 하나라도 있으면 즉시 경고 표시하고 제출 중단
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 최종 검증된 정규화 URL
    const finalValidation = validateUrl(trimmedUrl);
    if (!finalValidation.isValid) {
      setErrors({ url: finalValidation.errorMessage || "올바른 웹 주소를 입력해주세요." });
      return;
    }

    const currentCatObj = CATEGORIES.find((c) => c.value === category);

    try {
      setIsSubmitting(true);
      await onSave({
        title: trimmedTitle,
        description: description.trim(),
        url: finalValidation.normalizedUrl,
        category,
        icon: currentCatObj?.icon || "globe",
        isActive,
        isFeatured,
      });
      onClose();
    } catch (error) {
      console.error("LinkModal save error:", error);
      setErrors({ title: "링크 저장 중 문제가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[440px] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "링크 수정하기" : "새 링크 추가"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "기존 링크의 제목, URL 및 노출 옵션을 변경합니다."
              : "공유하고 싶은 웹페이지 주소와 설명을 입력해주세요."}
          </DialogDescription>
        </DialogHeader>

        {/* 폼 전체 에러 알림 배너 */}
        {(errors.title || errors.url) && (
          <div className="flex items-center gap-2 p-3 bg-[#FFF0F3] border border-[#FF3A5B]/30 rounded-[10px] text-xs text-[#FF3A5B] font-semibold animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>입력 항목을 확인해주세요. 빨간색 경고 표시된 항목을 수정해야 합니다.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-1">
          {/* 1. 링크 제목 입력 칸 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-link-title" className="text-xs font-semibold text-[#141A24]">
                링크 제목 <span className="text-[#FF3A5B]">*</span>
              </label>
              {errors.title && (
                <span className="text-[11px] text-[#FF3A5B] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </span>
              )}
            </div>
            <Input
              id="modal-link-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.title;
                    return next;
                  });
                }
              }}
              placeholder="예: Lerobot S-101 배터리 전압 분류 로봇"
              maxLength={80}
              className={errors.title ? "border-[#FF3A5B] focus-visible:ring-[#FF3A5B] bg-[#FFF0F3]/20" : ""}
            />
          </div>

          {/* 2. URL 입력 칸 & 유효성 안내 */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="modal-link-url" className="text-xs font-semibold text-[#141A24]">
                웹 주소 (URL) <span className="text-[#FF3A5B]">*</span>
              </label>
              <span className="text-[11px] text-[#697383]">
                http:// 생략 시 https:// 자동 보정
              </span>
            </div>
            <Input
              id="modal-link-url"
              value={rawUrl}
              onChange={(e) => {
                setRawUrl(e.target.value);
                if (errors.url) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.url;
                    return next;
                  });
                }
              }}
              onBlur={handleUrlBlur}
              placeholder="예: github.com/limgyumin-kr 또는 https://example.com"
              className={errors.url ? "border-[#FF3A5B] focus-visible:ring-[#FF3A5B] bg-[#FFF0F3]/20" : ""}
            />
            {errors.url && (
              <p className="text-xs text-[#FF3A5B] font-semibold mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.url}</span>
              </p>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#141A24]">카테고리</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-1.5 p-2 rounded-[10px] text-xs font-semibold border transition socar-press text-left ${
                      isSelected
                        ? "bg-[#EBF5FF] border-[#0078FF] text-[#0078FF]"
                        : "bg-white border-[#E5E8EF] text-[#697383] hover:bg-[#F2F3F8]"
                    }`}
                  >
                    <CategoryIcon category={cat.value} icon={cat.icon} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 설명 입력 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#141A24]">간단 설명 (선택)</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="방문자에게 안내할 한 줄 설명을 적어주세요."
              maxLength={120}
            />
          </div>

          {/* 스위치 옵션들: 노출 상태 & 추천 배지 */}
          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F9F9FB] border border-[#E5E8EF] mt-1">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#141A24]">공개 노출</span>
              <span className="text-[11px] text-[#697383]">
                {isActive ? "방문자 화면에 즉시 표시됩니다." : "방문자 화면에서 숨김 처리됩니다."}
              </span>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#F9F9FB] border border-[#E5E8EF]">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#141A24]">대표 링크 (FEATURED)</span>
              <span className="text-[11px] text-[#697383]">
                상단 추천 배지와 강조 테두리가 적용됩니다.
              </span>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: buttonColor }}
              className="text-white hover:opacity-90 active:scale-[0.96] transition disabled:opacity-50"
            >
              {isSubmitting ? "저장 중..." : initialData ? "수정 완료" : "추가하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
