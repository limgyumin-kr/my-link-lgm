import { create } from "zustand";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from "firebase/firestore";
import { auth, db } from "./firebase";
import {
  ensureProfile,
  isPermissionDenied,
  usernameFromEmail,
  UserProfileDoc,
} from "./profile";

/** Firestore users/{uid} 문서에 저장되는 사용자 정보 */
export interface UserDoc {
  uid: string;
  email: string;
  photoURL: string;
  createdAt: string;
  lastLoginAt: string;
}

/** loading: onAuthStateChanged 첫 응답 전 / signedIn / signedOut */
export type AuthStatus = "loading" | "signedIn" | "signedOut";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  /** Firestore users/{uid} 문서 (화면 표시용) */
  userDoc: UserDoc | null;
  /**
   * 최초 로그인 시 프로필 자동 생성(users/{uid}/profile/main)이 실패한 이유 (보안 규칙 미적용 등)
   * 프로필 데이터 자체는 TanStack Query 캐시(queries.ts)에서 관리
   */
  profileSetupError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** 앱 전체에서 1회만 호출: onAuthStateChanged 로그인 상태 감지 시작 */
  startAuthListener: () => () => void;
}

const userDocRef = (uid: string) => doc(db, "users", uid);

/**
 * 화면 표시 이름: 프로필 displayName → Google 계정 이름 → 이메일 앞부분 → '사용자'
 */
export function getDisplayName(
  profile: Pick<UserProfileDoc, "displayName"> | null | undefined,
  user: Pick<User, "displayName" | "email"> | null | undefined
): string {
  return (
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split("@")[0]?.trim() ||
    "사용자"
  );
}

/** 프로필이 아직 없을 때 보여줄 기본 username (이메일 앞부분) */
export function getDefaultUsername(user: Pick<User, "email"> | null | undefined): string {
  return usernameFromEmail(user?.email);
}

/**
 * 로그인 시 users/{uid} 문서를 생성/갱신 (최초 로그인 시에만 createdAt 기록)
 */
async function upsertUserDoc(user: User): Promise<void> {
  const ref = userDocRef(user.uid);
  const now = new Date().toISOString();
  const snap = await getDoc(ref);
  await setDoc(
    ref,
    {
      uid: user.uid,
      // 표시 이름/username/소개글은 users/{uid}/profile/main 에서 관리
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      lastLoginAt: now,
      ...(snap.exists() ? {} : { createdAt: now }),
    },
    { merge: true }
  );
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  userDoc: null,
  profileSetupError: null,

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // 성공 시 상태 반영은 onAuthStateChanged가 담당
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      // 팝업이 차단된 환경(인앱 브라우저, 팝업 차단 설정 등)에서는 페이지 이동 방식으로 재시도
      if ((error as { code?: string })?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
  },

  startAuthListener: () => {
    let unsubscribeUserDoc: Unsubscribe | null = null;

    // 리다이렉트 방식 로그인에서 돌아온 경우 결과 처리 (성공 시 onAuthStateChanged가 상태 반영)
    getRedirectResult(auth).catch((error) => {
      console.warn("Google 리다이렉트 로그인 실패:", (error as { code?: string })?.code ?? error);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeUserDoc?.();
      unsubscribeUserDoc = null;

      if (!user) {
        set({
          status: "signedOut",
          user: null,
          userDoc: null,
          profileSetupError: null,
        });
        return;
      }

      set({
        status: "signedIn",
        user,
        userDoc: null,
        profileSetupError: null,
      });

      // 프로필 자동 생성(최초 로그인, 이미 있으면 그대로) - 구독/캐시 반영은 AuthSync가 담당
      // username = 이메일 앞부분(중복 시 _2 등), displayName = Google 이름
      ensureProfile(user).catch((error) => {
        console.warn("프로필 자동 생성 실패:", (error as { code?: string })?.code ?? error);
        set({
          profileSetupError: isPermissionDenied(error)
            ? "Firestore 보안 규칙에서 usernames 컬렉션 접근이 허용되지 않아 프로필을 만들지 못했습니다."
            : "프로필을 만드는 중 문제가 발생했습니다.",
        });
      });

      // users/{uid} 문서를 저장한 뒤 실시간 구독하여 화면에 표시
      upsertUserDoc(user).catch((error) =>
        console.error("users/{uid} 사용자 정보 저장 실패:", error)
      );
      unsubscribeUserDoc = onSnapshot(
        userDocRef(user.uid),
        (snap) => {
          if (snap.exists()) set({ userDoc: snap.data() as UserDoc });
        },
        (error) => console.error("users/{uid} 사용자 정보 구독 실패:", error)
      );
    });

    return () => {
      unsubscribeUserDoc?.();
      unsubscribeAuth();
    };
  },
}));

/** 로그인 에러 코드 → 사용자 안내 문구 (팝업을 직접 닫은 경우는 null) */
export function getAuthErrorMessage(error: unknown): string | null {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return null;
    case "auth/popup-blocked":
      return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해주세요.";
    case "auth/operation-not-allowed":
      return "Firebase 콘솔에서 Google 로그인이 활성화되어 있지 않습니다.";
    case "auth/unauthorized-domain":
      return "현재 도메인이 Firebase 승인된 도메인에 등록되어 있지 않습니다.";
    case "auth/network-request-failed":
      return "네트워크 오류로 로그인하지 못했습니다.";
    default:
      return "로그인 중 문제가 발생했습니다. 다시 시도해주세요.";
  }
}
