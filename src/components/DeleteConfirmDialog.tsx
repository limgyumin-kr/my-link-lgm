"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  /** 삭제 성공 시 resolve, 실패 시 reject. 성공 시에만 다이얼로그가 닫힌다. */
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // 실패 안내는 호출자(토스트)에서 처리하고, 다이얼로그는 열어둬서 재시도 가능하게 함
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogContent className="max-w-[380px]">
        <DialogHeader>
          <DialogTitle>링크 삭제</DialogTitle>
          <DialogDescription className="text-sm pt-1">
            {title ? (
              <>
                <span className="font-semibold text-[#141A24]">&apos;{title}&apos;</span> 링크를 정말
                삭제하시겠습니까?
              </>
            ) : (
              "선택한 링크를 정말 삭제하시겠습니까?"
            )}
            <br />
            이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "삭제 중..." : "삭제하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
