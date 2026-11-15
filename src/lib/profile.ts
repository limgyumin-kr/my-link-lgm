import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  Unsubscribe,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firebase";

/**
 * 사용자 프로필 (Firestore users/{uid}/profile/main)
 * - username: 공유 URL용 고유 아이디 (중복 불가, usernames/{username} 인덱스로 보장)
 * - displayName: 화면에 표시되는 이름
 * - bio: 소개글
 */
export interface UserProfileDoc {
  username: string;
  displayName: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileInput = Pick<UserProfileDoc, "username" | "displayName" | "bio">;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const DISPLAY_NAME_MAX = 30;
export const BIO_MAX = 160;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

/**
 * 사용할 수 없는 username (앱의 고정 경로와 겹치거나 오해의 소지가 있는 이름)
 * /mypage, /api 같은 고정 경로가 /[username] 보다 우선하므로 이 이름들은 공유 페이지로 열 수 없다.
 * ※ Firestore 보안 규칙의 usernames 생성 조건에도 같은 목록이 들어 있다.
 */
export const RESERVED_USERNAMES = [
  "mypage", "api", "admin", "login", "logout", "signin", "signup", "settings",
  "profile", "user", "users", "links", "mylink", "about", "help", "support",
  "static", "public", "assets", "null", "undefined", "stats",
] as const;

export function isReservedUsername(username: string): boolean {
  return (RESERVED_USERNAMES as readonly string[]).includes(username);
}

/** 형식(3~20자 a-z0-9_) + 예약어가 아닌지 */
export function isUsernameFormatValid(username: string): boolean {
  return USERNAME_PATTERN.test(username) && !isReservedUsername(username);
}

/** 프로필 문서: users/{uid}/profile/main (문서 경로는 짝수 세그먼트여야 하므로 main 문서 1개 사용) */
export const profileDocRef = (uid: string) => doc(db, "users", uid, "profile", "main");

/** username 중복 방지 인덱스: usernames/{username} → { uid } */
const usernameDocRef = (username: string) => doc(db, "usernames", username);

/** username 중복 시 던지는 에러 */
export class UsernameTakenError extends Error {
  constructor(public username: string) {
    super(`이미 사용 중인 username입니다: ${username}`);
    this.name = "UsernameTakenError";
  }
}

/** username 형식 검사. 문제가 있으면 안내 문구, 없으면 null */
export function validateUsername(username: string): string | null {
  if (!username) return "username을 입력해주세요.";
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `username은 ${USERNAME_MIN}~${USERNAME_MAX}자로 입력해주세요.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "영문 소문자, 숫자, 밑줄(_)만 사용할 수 있습니다.";
  }
  if (isReservedUsername(username)) {
    return "시스템에서 사용하는 이름이라 쓸 수 없습니다. 다른 이름을 입력해주세요.";
  }
  return null;
}

export function validateDisplayName(displayName: string): string | null {
  if (!displayName.trim()) return "표시 이름을 입력해주세요.";
  if (displayName.trim().length > DISPLAY_NAME_MAX) {
    return `표시 이름은 ${DISPLAY_NAME_MAX}자 이내로 입력해주세요.`;
  }
  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.length > BIO_MAX) return `소개글은 ${BIO_MAX}자 이내로 입력해주세요.`;
  return null;
}

/**
 * 이메일 앞부분을 username 규칙에 맞게 변환
 * 예: "Gil.Dong-Hong@gmail.com" → "gil_dong_hong"
 */
export function usernameFromEmail(email?: string | null): string {
  const prefix = (email?.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, USERNAME_MAX);
  // 너무 짧으면 규칙(3자 이상)을 만족하도록 보충
  return prefix.length >= USERNAME_MIN ? prefix : `${prefix || "user"}_${Math.random().toString(36).slice(2, 6)}`.slice(0, USERNAME_MAX);
}

/** 중복 시 뒤에 붙일 후보: base, base_2 ~ base_9, base_xxxx(랜덤) */
function usernameCandidates(base: string): string[] {
  const list = [base];
  for (let i = 2; i <= 9; i++) list.push(`${base.slice(0, USERNAME_MAX - 2)}_${i}`);
  list.push(`${base.slice(0, USERNAME_MAX - 5)}_${Math.random().toString(36).slice(2, 6)}`);
  // 예약어(예: 이메일이 admin@... 인 경우)는 후보에서 제외 → admin_2 부터 사용
  return list.filter((name) => !isReservedUsername(name));
}

/**
 * 로그인 시 프로필이 없으면 자동 생성
 * - username: 이메일 앞부분 (중복이면 _2, _3 ... 붙여서 비어 있는 이름 사용)
 * - displayName: Google 계정 이름 (없으면 username)
 * 이미 프로필이 있으면 아무것도 하지 않는다.
 */
export async function ensureProfile(user: User): Promise<void> {
  const ref = profileDocRef(user.uid);
  const base = usernameFromEmail(user.email);

  await runTransaction(db, async (tx) => {
    const profileSnap = await tx.get(ref);
    if (profileSnap.exists()) return;

    let chosen: string | null = null;
    for (const candidate of usernameCandidates(base)) {
      const snap = await tx.get(usernameDocRef(candidate));
      if (!snap.exists() || snap.data()?.uid === user.uid) {
        chosen = candidate;
        break;
      }
    }
    if (!chosen) throw new UsernameTakenError(base);

    const now = new Date().toISOString();
    tx.set(usernameDocRef(chosen), { uid: user.uid, createdAt: now });
    tx.set(ref, {
      username: chosen,
      displayName: (user.displayName?.trim() || chosen).slice(0, DISPLAY_NAME_MAX),
      bio: "",
      createdAt: now,
      updatedAt: now,
    } satisfies UserProfileDoc);
  });
}

/**
 * 프로필 저장 (username 중복 체크 포함, 트랜잭션으로 원자적 처리)
 * - 새 username을 다른 사용자가 쓰고 있으면 UsernameTakenError
 * - username이 바뀌면 이전 username 인덱스는 삭제해 다른 사람이 쓸 수 있게 함
 */
export async function saveProfile(uid: string, input: ProfileInput): Promise<void> {
  const next: ProfileInput = {
    username: input.username.trim(),
    displayName: input.displayName.trim(),
    bio: input.bio.trim(),
  };
  const invalid =
    validateUsername(next.username) ?? validateDisplayName(next.displayName) ?? validateBio(next.bio);
  if (invalid) throw new Error(invalid);

  await runTransaction(db, async (tx) => {
    const ref = profileDocRef(uid);
    const currentSnap = await tx.get(ref);
    const current = currentSnap.exists() ? (currentSnap.data() as UserProfileDoc) : null;

    const nextIndexSnap = await tx.get(usernameDocRef(next.username));
    if (nextIndexSnap.exists() && nextIndexSnap.data()?.uid !== uid) {
      throw new UsernameTakenError(next.username);
    }

    const now = new Date().toISOString();
    if (!nextIndexSnap.exists()) {
      tx.set(usernameDocRef(next.username), { uid, createdAt: now });
    }
    if (current?.username && current.username !== next.username) {
      tx.delete(usernameDocRef(current.username));
    }
    tx.set(
      ref,
      {
        ...next,
        updatedAt: now,
        ...(current ? {} : { createdAt: now }),
      },
      { merge: true }
    );
  });
}

/** 프로필 1회 조회 (TanStack Query queryFn) */
export async function getProfile(uid: string): Promise<UserProfileDoc | null> {
  const snap = await getDoc(profileDocRef(uid));
  return snap.exists() ? (snap.data() as UserProfileDoc) : null;
}

/** 프로필 문서 실시간 구독 */
export function subscribeProfile(
  uid: string,
  onUpdate: (profile: UserProfileDoc | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    profileDocRef(uid),
    (snap) => onUpdate(snap.exists() ? (snap.data() as UserProfileDoc) : null),
    (error) => {
      console.error("users/{uid}/profile 구독 실패:", error);
      onError?.(error);
    }
  );
}

/** Firestore 권한 오류인지 (보안 규칙 미적용 등) */
export function isPermissionDenied(error: unknown): boolean {
  return (error as { code?: string })?.code === "permission-denied";
}
