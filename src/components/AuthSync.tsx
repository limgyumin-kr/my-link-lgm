"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/authStore";
import { subscribeToFirestoreLinks } from "@/lib/firestoreLinks";
import { subscribeProfile } from "@/lib/profile";
import { queryKeys } from "@/lib/queries";

/**
 * 앱 전체에서 한 번만 렌더링되는 동기화 컴포넌트 (화면에는 아무것도 그리지 않음)
 * - onAuthStateChanged로 로그인 상태 감지
 * - 로그인한 사용자의 프로필/링크를 Firestore 실시간 구독 → TanStack Query 캐시에 반영
 *   (같은 데이터를 낙관적으로 수정 중일 때는 중간 스냅샷으로 덮어쓰지 않고,
 *    수정이 끝나면 mutation의 onSettled에서 서버 값으로 다시 맞춘다)
 * - 로그아웃 시 이전 사용자의 캐시 제거
 */
export function AuthSync() {
  const queryClient = useQueryClient();
  const startAuthListener = useAuthStore((s) => s.startAuthListener);
  const uid = useAuthStore((s) => s.user?.uid ?? null);

  useEffect(() => startAuthListener(), [startAuthListener]);

  useEffect(() => {
    if (!uid) {
      // 로그아웃: 다른 사용자가 로그인했을 때 이전 데이터가 보이지 않도록 캐시 비움
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["links"] });
      return;
    }

    const profileKey = queryKeys.profile(uid);
    const linksKey = queryKeys.links(uid);
    const isMutating = (key: readonly unknown[]) => queryClient.isMutating({ mutationKey: key }) > 0;

    const unsubscribeProfile = subscribeProfile(uid, (profile) => {
      // 최초 로그인 직후 프로필 생성 전(null)에는 반영하지 않음
      if (profile && !isMutating(profileKey)) queryClient.setQueryData(profileKey, profile);
    });
    const unsubscribeLinks = subscribeToFirestoreLinks(uid, (links) => {
      if (!isMutating(linksKey)) queryClient.setQueryData(linksKey, links);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeLinks();
    };
  }, [uid, queryClient]);

  // 이전 버전에서 데모 프로필을 저장하던 LocalStorage 키 정리 (현재는 사용하지 않음)
  useEffect(() => {
    try {
      localStorage.removeItem("mylink_profile_data_v1");
    } catch {
      // 저장소 접근이 막힌 환경(시크릿 모드 등)은 무시
    }
  }, []);

  return null;
}
