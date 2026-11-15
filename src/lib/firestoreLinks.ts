import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { LinkItem } from "@/types/link";
import { normalizeCategory, normalizeLinkCategory } from "./categories";

/**
 * Firestore 링크 컬렉션 경로: users/{uid}/links (로그인한 사용자별로 개인화)
 */
export const getLinksCollectionRef = (uid: string) => {
  return collection(db, "users", uid, "links");
};

export const getLinkDocRef = (uid: string, id: string) => {
  return doc(db, "users", uid, "links", id);
};

/**
 * Firestore 문서 데이터 → LinkItem 변환.
 * 이전 카테고리(ROBOTICS, ARTICLE 등)로 저장된 문서는 새 3개 카테고리로 자동 변환한다.
 */
function docToLink(id: string, data: DocumentData): LinkItem {
  return normalizeLinkCategory({
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    url: data.url ?? "",
    category: data.category,
    icon: data.icon ?? "globe",
    isActive: data.isActive ?? true,
    isFeatured: Boolean(data.isFeatured),
    order: typeof data.order === "number" ? data.order : 0,
    clickCount: typeof data.clickCount === "number" ? data.clickCount : 0,
    createdAt: data.createdAt ?? new Date().toISOString(),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  });
}

export type NewLinkInput = Omit<LinkItem, "id" | "createdAt" | "updatedAt" | "clickCount" | "order">;

/**
 * 새 링크 초안 생성 (Firestore 문서 id를 클라이언트에서 미리 발급)
 * 낙관적 업데이트로 화면에 먼저 넣은 항목과 실제 저장 문서의 id가 같아서
 * 실시간 구독 데이터로 교체될 때 깜빡이지 않는다.
 */
export function createLinkDraft(uid: string, newLinkData: NewLinkInput, order: number = 0): LinkItem {
  const newDocRef = doc(getLinksCollectionRef(uid));
  const now = new Date().toISOString();

  // Firestore는 undefined 필드가 포함되면 에러를 던지므로 명시적 안전값 지정
  return {
    id: newDocRef.id,
    title: newLinkData.title.trim(),
    description: newLinkData.description?.trim() || "",
    url: newLinkData.url.trim(),
    category: normalizeCategory(newLinkData.category),
    icon: newLinkData.icon || "globe",
    isActive: newLinkData.isActive ?? true,
    isFeatured: Boolean(newLinkData.isFeatured),
    order,
    clickCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Firestore users/{uid}/links/{link.id} 에 새 링크 저장
 */
export async function saveNewLink(uid: string, link: LinkItem): Promise<void> {
  await setDoc(getLinkDocRef(uid, link.id), link);
}

/**
 * Firestore users/{uid}/links 경로의 링크 목록 조회 (1회성)
 */
export async function getLinksFromFirestore(uid: string): Promise<LinkItem[]> {
  const q = query(getLinksCollectionRef(uid), orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => docToLink(docSnap.id, docSnap.data()));
}

/**
 * Firestore users/{uid}/links 경로의 링크 수정
 */
export async function updateLinkInFirestore(
  uid: string,
  id: string,
  updates: Partial<LinkItem>
): Promise<void> {
  // id/createdAt은 수정 대상이 아니므로 제외
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt: _createdAt, ...rest } = updates;
  const cleanUpdates: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date().toISOString(),
  };

  // Firestore는 undefined 값을 허용하지 않으므로 제거
  Object.keys(cleanUpdates).forEach((key) => {
    if (cleanUpdates[key] === undefined) {
      delete cleanUpdates[key];
    }
  });

  // 실패 시 호출자가 롤백/에러 안내를 할 수 있도록 에러를 그대로 던짐
  await updateDoc(getLinkDocRef(uid, id), cleanUpdates);
}

/**
 * Firestore users/{uid}/links 경로의 링크 삭제
 * 실패 시 에러를 그대로 던짐 (호출자에서 롤백 처리)
 */
export async function deleteLinkFromFirestore(uid: string, id: string): Promise<void> {
  await deleteDoc(getLinkDocRef(uid, id));
}

/**
 * 공개 페이지에서 링크 클릭 시 클릭 수 +1 (로그인하지 않은 방문자도 가능)
 * - 서버에서 원자적으로 더하는 increment(1) 사용 → 동시에 여러 명이 눌러도 누락 없음
 * - 보안 규칙상 clickCount 외의 필드(updatedAt 등)를 함께 바꾸면 거부되므로 clickCount만 갱신
 */
export async function incrementLinkClick(uid: string, linkId: string): Promise<void> {
  await updateDoc(getLinkDocRef(uid, linkId), { clickCount: increment(1) });
}

/**
 * Firestore users/{uid}/links 경로의 실시간 변경 구독
 */
export function subscribeToFirestoreLinks(
  uid: string,
  onUpdate: (links: LinkItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(getLinksCollectionRef(uid), orderBy("order", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onUpdate(snapshot.docs.map((docSnap) => docToLink(docSnap.id, docSnap.data())));
    },
    (err) => {
      console.error("subscribeToFirestoreLinks error:", err);
      onError?.(err);
    }
  );
}
