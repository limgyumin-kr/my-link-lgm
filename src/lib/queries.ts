"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./authStore";
import {
  createLinkDraft,
  saveNewLink,
  updateLinkInFirestore,
  deleteLinkFromFirestore,
  getLinksFromFirestore,
  NewLinkInput,
} from "./firestoreLinks";
import { getProfile, saveProfile, ProfileInput, UserProfileDoc } from "./profile";
import { LinkItem } from "@/types/link";

/**
 * TanStack Query 키
 * - 같은 키를 mutationKey로도 사용해 "이 데이터를 수정 중인지"를 판단한다 (실시간 구독 반영 보류용)
 */
export const queryKeys = {
  profile: (uid: string) => ["profile", uid] as const,
  links: (uid: string) => ["links", uid] as const,
};

function useUid(): string | null {
  return useAuthStore((s) => s.user?.uid ?? null);
}

function requireUid(uid: string | null): string {
  if (!uid) throw new Error("로그인이 필요합니다.");
  return uid;
}

/**
 * 같은 키의 낙관적 수정이 모두 끝났을 때만 서버 값으로 다시 맞춘다.
 * (여러 수정이 겹칠 때 중간 결과로 덮어써 화면이 튀는 것을 방지)
 */
function invalidateWhenIdle(qc: QueryClient, key: readonly unknown[]) {
  if (qc.isMutating({ mutationKey: key }) === 1) {
    void qc.invalidateQueries({ queryKey: key });
  }
}

// ───────────────────────────── 프로필 ─────────────────────────────

/** users/{uid}/profile/main (실시간 구독은 AuthSync가 캐시에 반영) */
export function useProfileQuery() {
  const uid = useUid();
  return useQuery({
    queryKey: queryKeys.profile(uid ?? "-"),
    queryFn: () => getProfile(requireUid(uid)),
    enabled: Boolean(uid),
  });
}

/**
 * 프로필 저장 (낙관적 업데이트)
 * - 저장을 누르는 즉시 캐시를 새 값으로 바꿔 헤더/메뉴의 이름이 바로 바뀜
 * - username 중복 등으로 실패하면 이전 값으로 되돌림
 */
export function useSaveProfileMutation() {
  const qc = useQueryClient();
  const uid = useUid();
  const key = queryKeys.profile(uid ?? "-");

  return useMutation({
    mutationKey: key,
    mutationFn: (input: ProfileInput) => saveProfile(requireUid(uid), input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<UserProfileDoc | null>(key);
      const now = new Date().toISOString();
      const optimistic: UserProfileDoc = {
        createdAt: previous?.createdAt ?? now,
        username: input.username.trim(),
        displayName: input.displayName.trim(),
        bio: input.bio.trim(),
        updatedAt: now,
      };
      qc.setQueryData<UserProfileDoc | null>(key, optimistic);
      return { previous };
    },
    onError: (_error, _input, context) => {
      qc.setQueryData(key, context?.previous ?? null);
    },
    onSettled: () => invalidateWhenIdle(qc, key),
  });
}

// ───────────────────────────── 링크 ─────────────────────────────

/** users/{uid}/links (실시간 구독은 AuthSync가 캐시에 반영) */
export function useLinksQuery() {
  const uid = useUid();
  return useQuery({
    queryKey: queryKeys.links(uid ?? "-"),
    queryFn: () => getLinksFromFirestore(requireUid(uid)),
    enabled: Boolean(uid),
  });
}

/** 링크 mutation 공통: 이전 목록을 보관하고 낙관적으로 바꾼 뒤, 실패 시 되돌림 */
function useOptimisticLinksMutation<TVariables>(
  mutationFn: (uid: string, variables: TVariables) => Promise<unknown>,
  applyOptimistic: (links: LinkItem[], variables: TVariables) => LinkItem[]
) {
  const qc = useQueryClient();
  const uid = useUid();
  const key = queryKeys.links(uid ?? "-");

  return useMutation({
    mutationKey: key,
    mutationFn: (variables: TVariables) => mutationFn(requireUid(uid), variables),
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<LinkItem[]>(key);
      qc.setQueryData<LinkItem[]>(key, applyOptimistic(previous ?? [], variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => invalidateWhenIdle(qc, key),
  });
}

/**
 * 링크 추가: 문서 id를 미리 발급한 초안을 목록 맨 위에 바로 넣고 저장
 * (변수로 초안을 넘겨 onMutate와 mutationFn이 같은 id를 사용)
 */
export function useAddLinkMutation() {
  const mutation = useOptimisticLinksMutation<LinkItem>(
    (uid, draft) => saveNewLink(uid, draft),
    (links, draft) => [draft, ...links.filter((l) => l.id !== draft.id)]
  );
  const qc = useQueryClient();
  const uid = useUid();

  return {
    ...mutation,
    /** 입력값으로 초안을 만들어 낙관적으로 추가 */
    addLink: (input: NewLinkInput) => {
      const owner = requireUid(uid);
      const current = qc.getQueryData<LinkItem[]>(queryKeys.links(owner)) ?? [];
      // 새 링크는 목록 최상단(order가 가장 작게)에 배치
      const order = current.length > 0 ? Math.min(...current.map((l) => l.order)) - 1 : 1;
      const draft = createLinkDraft(owner, input, order);
      return mutation.mutateAsync(draft);
    },
  };
}

/** 링크 수정 */
export function useUpdateLinkMutation() {
  return useOptimisticLinksMutation<{ id: string; updates: Partial<LinkItem> }>(
    (uid, { id, updates }) => updateLinkInFirestore(uid, id, updates),
    (links, { id, updates }) =>
      links.map((l) => (l.id === id ? { ...l, ...updates, id, updatedAt: new Date().toISOString() } : l))
  );
}

/** 공개/비공개 전환 */
export function useToggleLinkMutation() {
  return useOptimisticLinksMutation<{ id: string; isActive: boolean }>(
    (uid, { id, isActive }) => updateLinkInFirestore(uid, id, { isActive }),
    (links, { id, isActive }) =>
      links.map((l) => (l.id === id ? { ...l, isActive, updatedAt: new Date().toISOString() } : l))
  );
}

/** 링크 삭제 */
export function useDeleteLinkMutation() {
  return useOptimisticLinksMutation<{ id: string }>(
    (uid, { id }) => deleteLinkFromFirestore(uid, id),
    (links, { id }) => links.filter((l) => l.id !== id)
  );
}
