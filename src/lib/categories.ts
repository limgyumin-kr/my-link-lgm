import { LinkCategory, LinkItem } from "@/types/link";

/**
 * 링크 카테고리 단일 정의 (모달 선택지, 카드 배지, 필터 탭이 모두 이 목록을 사용)
 */
export const LINK_CATEGORIES: { value: LinkCategory; label: string; icon: string }[] = [
  { value: "PORTFOLIO", label: "포트폴리오", icon: "file-text" },
  { value: "WEBSITE", label: "공용 웹사이트", icon: "globe" },
  { value: "ETC", label: "기타", icon: "layers" },
];

export const DEFAULT_CATEGORY: LinkCategory = "PORTFOLIO";

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  LINK_CATEGORIES.map((c) => [c.value, c.label])
);

/**
 * 이전 5개 카테고리 → 새 3개 카테고리 매핑
 * (Firestore/LocalStorage에 이미 저장된 링크를 읽을 때 자동 변환)
 */
const LEGACY_CATEGORY_MAP: Record<string, LinkCategory> = {
  PORTFOLIO: "PORTFOLIO",
  ARTICLE: "WEBSITE",
  COMMUNITY: "WEBSITE",
  ROBOTICS: "ETC",
  DEVELOPMENT: "ETC",
};

export function normalizeCategory(raw: unknown): LinkCategory {
  if (typeof raw === "string") {
    if (LINK_CATEGORIES.some((c) => c.value === raw)) return raw as LinkCategory;
    if (raw in LEGACY_CATEGORY_MAP) return LEGACY_CATEGORY_MAP[raw];
  }
  return "ETC";
}

/**
 * 링크의 카테고리를 새 체계로 변환. 카테고리가 바뀐 경우 아이콘도 새 카테고리 아이콘으로 맞춘다.
 */
export function normalizeLinkCategory<T extends { category?: unknown; icon?: string }>(
  link: T
): Omit<T, "category"> & { category: LinkCategory } {
  const category = normalizeCategory(link.category);
  if (category === link.category) return link as Omit<T, "category"> & { category: LinkCategory };
  const icon = LINK_CATEGORIES.find((c) => c.value === category)?.icon;
  return { ...link, category, icon };
}

/** 저장된 링크 배열 전체를 새 카테고리 체계로 변환 */
export function normalizeLinks(links: LinkItem[]): LinkItem[] {
  return links.map((l) => normalizeLinkCategory(l));
}
