import { cache } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { profileDocRef, isUsernameFormatValid, UserProfileDoc } from "./profile";
import { normalizeLinkCategory } from "./categories";
import { LinkItem } from "@/types/link";

export interface PublicPage {
  uid: string;
  profile: Pick<UserProfileDoc, "username" | "displayName" | "bio">;
  /** 공개(isActive) 링크만, 대표 링크 → order 오름차순 */
  links: LinkItem[];
}

/**
 * 공개 프로필 페이지 데이터 조회 (/[username])
 * 1) usernames/{username} 인덱스에서 uid 조회
 * 2) users/{uid}/profile/main 의 profile.username 이 URL의 username과 일치하는지 확인
 * 3) users/{uid}/links 에서 공개 링크 조회
 * 사용자를 찾지 못하면 null (→ 404)
 *
 * React cache로 감싸 generateMetadata와 page에서 같은 요청을 한 번만 조회한다.
 */
export const getPublicPage = cache(async (rawUsername: string): Promise<PublicPage | null> => {
  const username = decodeURIComponent(rawUsername).trim().toLowerCase();
  if (!isUsernameFormatValid(username)) return null;

  // 1) username → uid
  const indexSnap = await getDoc(doc(db, "usernames", username));
  const uid = indexSnap.exists() ? (indexSnap.data().uid as string | undefined) : undefined;
  if (!uid) return null;

  // 2) 프로필 조회 + username 일치 확인 (인덱스와 프로필이 어긋난 경우 대비)
  const profileSnap = await getDoc(profileDocRef(uid));
  if (!profileSnap.exists()) return null;
  const profile = profileSnap.data() as UserProfileDoc;
  if (profile.username !== username) return null;

  // 3) 공개 링크만 조회 (보안 규칙상 비로그인 방문자는 isActive == true 조건이 있어야 읽을 수 있음)
  //    정렬은 메모리에서 처리해 별도 복합 색인 없이 동작하도록 함
  const linksSnap = await getDocs(
    query(collection(db, "users", uid, "links"), where("isActive", "==", true))
  );
  const links = linksSnap.docs
    .map((d) => {
      const data = d.data();
      return normalizeLinkCategory({
        id: d.id,
        title: data.title ?? "",
        description: data.description ?? "",
        url: data.url ?? "",
        category: data.category,
        icon: data.icon ?? "globe",
        isActive: true,
        isFeatured: Boolean(data.isFeatured),
        order: typeof data.order === "number" ? data.order : 0,
        clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
        createdAt: data.createdAt ?? "",
        updatedAt: data.updatedAt ?? "",
      }) as LinkItem;
    })
    .filter((l) => l.url)
    .sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) || a.order - b.order);

  return {
    uid,
    profile: {
      username: profile.username,
      displayName: profile.displayName || profile.username,
      bio: profile.bio ?? "",
    },
    links,
  };
});
