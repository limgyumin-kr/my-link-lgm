/**
 * 공개 링크 페이지 URL (/{username})
 * 클라이언트에서만 호출 (window.location 사용)
 */
export function getPublicUrl(username: string): string {
  if (typeof window === "undefined") return `/${username}`;
  return `${window.location.origin}/${username}`;
}

/** 화면 표시용 (프로토콜 제외): localhost:3000/username */
export function getPublicUrlLabel(username: string): string {
  if (typeof window === "undefined") return `/${username}`;
  return `${window.location.host}/${username}`;
}
