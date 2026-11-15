"use client";

import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

/**
 * 앱 전역 sonner 토스트 컨테이너
 * - 위치: 중앙 상단 (52px 헤더 바로 아래에 겹치지 않도록 offset 지정)
 * - 사용: import { toast } from "sonner"; toast.success("메시지")
 */
export function Toaster(props: ToasterProps) {
  return (
    <SonnerToaster
      position="top-center"
      offset={64}
      mobileOffset={{ top: 64 }}
      richColors
      closeButton={false}
      duration={2500}
      toastOptions={{
        style: { fontFamily: "inherit", borderRadius: "12px" },
      }}
      {...props}
    />
  );
}
