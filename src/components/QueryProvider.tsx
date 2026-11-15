"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * TanStack Query 전역 Provider
 * - 프로필/링크 데이터는 Firestore 실시간 구독(AuthSync)이 캐시를 계속 갱신하므로
 *   자동 재조회(포커스·재연결·stale)는 끈다.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 요청(렌더)마다 새 클라이언트가 만들어지지 않도록 state로 1회 생성
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
