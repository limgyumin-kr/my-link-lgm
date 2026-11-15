"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Check, Loader2, RotateCcw, UserPen } from "lucide-react";
import { useAuthStore, getDefaultUsername } from "@/lib/authStore";
import { useProfileQuery, useSaveProfileMutation } from "@/lib/queries";
import { getPublicUrlLabel } from "@/lib/publicUrl";
import {
  validateUsername,
  validateDisplayName,
  validateBio,
  isPermissionDenied,
  UsernameTakenError,
  ProfileInput,
  USERNAME_MAX,
  DISPLAY_NAME_MAX,
  BIO_MAX,
} from "@/lib/profile";

type FieldErrors = Partial<Record<keyof ProfileInput, string>>;

/** 공백을 정리한 값끼리 같은지 */
function sameInput(a: ProfileInput, b: ProfileInput): boolean {
  return (
    a.username.trim() === b.username.trim() &&
    a.displayName.trim() === b.displayName.trim() &&
    a.bio.trim() === b.bio.trim()
  );
}

/**
 * 프로필 페이지의 공개 프로필 수정 영역
 * - 현재 저장된 값(users/{uid}/profile/main, TanStack Query 캐시)을 입력란에 채워서 보여주고 수정 후 저장
 * - 저장은 낙관적 업데이트: 헤더/메뉴/내 페이지 카드의 이름이 즉시 바뀌고, 실패하면 되돌림
 * - username 중복이면 이전 값으로 되돌리고 입력란 아래에 에러 표시 (입력한 값은 유지)
 */
export function ProfileEditCard() {
  const user = useAuthStore((s) => s.user);
  const profileSetupError = useAuthStore((s) => s.profileSetupError);
  const profileQuery = useProfileQuery();
  const profile = profileQuery.data ?? null;

  if (!user) return null;

  const loadError = profileQuery.isError
    ? "프로필을 불러오지 못했습니다."
    : !profile
      ? profileSetupError
      : null;

  // 첫 조회 중이거나, 최초 로그인 직후 프로필이 자동 생성되기를 기다리는 중
  if (profileQuery.isPending || (!profile && !loadError)) {
    return (
      <section className="rounded-[20px] bg-white border border-[#E5E8EF] p-5 sm:p-6 flex flex-col gap-3">
        <div className="h-5 w-28 rounded bg-[#F2F3F8] animate-pulse" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 w-full rounded-[10px] bg-[#F2F3F8] animate-pulse" />
        ))}
      </section>
    );
  }

  // 저장된 프로필이 없으면(생성 실패 등) 로그인 정보로 기본값 구성
  const initial: ProfileInput = profile
    ? { username: profile.username, displayName: profile.displayName, bio: profile.bio }
    : {
        username: getDefaultUsername(user),
        displayName: user.displayName ?? "",
        bio: "",
      };

  return (
    <ProfileEditForm
      key={profile ? "saved" : "new"}
      initial={initial}
      isSaved={Boolean(profile)}
      loadError={loadError}
    />
  );
}

function ProfileEditForm({
  initial,
  isSaved,
  loadError,
}: {
  initial: ProfileInput;
  isSaved: boolean;
  loadError: string | null;
}) {
  const saveProfile = useSaveProfileMutation();
  const isSaving = saveProfile.isPending;
  const [values, setValues] = useState<ProfileInput>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  // 마지막으로 저장을 시도한 값. 저장이 실패해 캐시가 되돌아가도 이 입력값은 덮어쓰지 않는다.
  // (TanStack Query는 캐시 변경 알림을 묶어서 비동기로 전달하므로, "저장 중" 플래그만으로는
  //  되돌림이 반영되는 렌더 시점을 보장할 수 없어 '시도한 값'을 기준으로 판단한다)
  const [lastSubmitted, setLastSubmitted] = useState<ProfileInput | null>(null);

  // 저장된 값(initial)이 바뀌었을 때(다른 탭에서 수정 등) 사용자가 고치고 있지 않았다면 새 값으로 맞추고,
  // 고치는 중이거나 방금 저장을 시도한 값이면 입력값을 유지한다.
  const [prevInitial, setPrevInitial] = useState<ProfileInput>(initial);
  if (!sameInput(prevInitial, initial)) {
    setPrevInitial(initial);
    const isAttemptedValue = lastSubmitted !== null && sameInput(values, lastSubmitted);
    if (!isAttemptedValue && sameInput(values, prevInitial)) setValues(initial);
  }

  const isDirty =
    !isSaved ||
    values.username !== initial.username ||
    values.displayName.trim() !== initial.displayName ||
    values.bio.trim() !== initial.bio;

  const update = (field: keyof ProfileInput, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setLastSubmitted(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {
      username: validateUsername(values.username) ?? undefined,
      displayName: validateDisplayName(values.displayName) ?? undefined,
      bio: validateBio(values.bio) ?? undefined,
    };
    if (nextErrors.username || nextErrors.displayName || nextErrors.bio) {
      setErrors(nextErrors);
      return;
    }

    setLastSubmitted(values);
    try {
      // 낙관적 업데이트: 호출 즉시 캐시가 새 값으로 바뀌고, 실패하면 mutation이 되돌린다
      await saveProfile.mutateAsync(values);
      // 성공: 이후 다른 탭에서 바뀐 값은 다시 폼에 반영되도록 기억 해제
      setLastSubmitted(null);
      toast.success("프로필이 저장되었습니다.", { description: `@${values.username.trim()}` });
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        setErrors({ username: "이미 사용 중인 username입니다. 다른 이름을 입력해주세요." });
        toast.error("이미 사용 중인 username입니다.", { description: `@${values.username}` });
      } else if (isPermissionDenied(error)) {
        toast.error("프로필을 저장할 권한이 없습니다.", {
          description: "Firestore 보안 규칙에 usernames 컬렉션 규칙이 필요합니다.",
        });
      } else {
        console.error("프로필 저장 실패:", error);
        toast.error("프로필 저장 중 문제가 발생했습니다.");
      }
    }
  };

  const shareUrl = getPublicUrlLabel(values.username || "username");

  return (
    <section className="rounded-[20px] bg-white border border-[#E5E8EF] p-5 sm:p-6">
      <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-[10px] bg-[#EBF5FF] text-[#0078FF] flex items-center justify-center">
              <UserPen className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-[#141A24]">공개 프로필</h2>
              <p className="text-[11px] text-[#99A1B1]">내 공개 페이지에 표시되는 정보입니다.</p>
            </div>
          </div>
          {isDirty && isSaved && (
            <button
              type="button"
              onClick={() => {
                setValues(initial);
                setLastSubmitted(null);
                setErrors({});
              }}
              disabled={isSaving}
              className="h-7 px-2 rounded-[8px] text-[11px] font-semibold text-[#697383] hover:bg-[#F2F3F8] flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              되돌리기
            </button>
          )}
        </div>

        {loadError && (
          <div className="rounded-[10px] border border-[#FFD1DA] bg-[#FFF0F3] px-3 py-2 text-[11px] text-[#FF3A5B] flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            <span>{loadError} 아래 값은 기본값이며, 저장하면 다시 시도합니다.</span>
          </div>
        )}

        {/* username */}
        <Field
          id="profile-username"
          label="username"
          hint="공유 URL에 사용됩니다. 영문 소문자, 숫자, 밑줄(_) 3~20자"
          error={errors.username}
          counter={`${values.username.length}/${USERNAME_MAX}`}
          current={isSaved ? `@${initial.username}` : undefined}
        >
          <div
            className={`flex items-center h-10 rounded-[10px] border bg-white transition focus-within:ring-2 focus-within:ring-[#0078FF]/40 ${
              errors.username ? "border-[#FF3A5B]" : "border-[#E5E8EF] focus-within:border-[#0078FF]"
            }`}
          >
            <span className="pl-3 pr-0.5 text-sm text-[#99A1B1] select-none">@</span>
            <input
              id="profile-username"
              value={values.username}
              onChange={(e) => update("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              maxLength={USERNAME_MAX}
              autoComplete="off"
              spellCheck={false}
              disabled={isSaving}
              aria-invalid={Boolean(errors.username)}
              aria-describedby="profile-username-help"
              className="flex-1 min-w-0 h-full bg-transparent pr-3 text-sm text-[#141A24] outline-none disabled:opacity-60"
            />
          </div>
          <p className="text-[11px] text-[#99A1B1] truncate">
            공유 URL: <span className="font-mono text-[#0078FF]">{shareUrl}</span>
          </p>
        </Field>

        {/* displayName */}
        <Field
          id="profile-displayName"
          label="표시 이름"
          error={errors.displayName}
          counter={`${values.displayName.length}/${DISPLAY_NAME_MAX}`}
          current={isSaved ? initial.displayName : undefined}
        >
          <input
            id="profile-displayName"
            value={values.displayName}
            onChange={(e) => update("displayName", e.target.value)}
            maxLength={DISPLAY_NAME_MAX}
            disabled={isSaving}
            aria-invalid={Boolean(errors.displayName)}
            className={`h-10 w-full rounded-[10px] border px-3 text-sm text-[#141A24] outline-none transition focus:ring-2 focus:ring-[#0078FF]/40 disabled:opacity-60 ${
              errors.displayName ? "border-[#FF3A5B]" : "border-[#E5E8EF] focus:border-[#0078FF]"
            }`}
          />
        </Field>

        {/* bio */}
        <Field
          id="profile-bio"
          label="소개글"
          error={errors.bio}
          counter={`${values.bio.length}/${BIO_MAX}`}
        >
          <textarea
            id="profile-bio"
            value={values.bio}
            onChange={(e) => update("bio", e.target.value)}
            maxLength={BIO_MAX}
            rows={3}
            placeholder="나를 한 줄로 소개해보세요."
            disabled={isSaving}
            aria-invalid={Boolean(errors.bio)}
            className={`w-full rounded-[10px] border px-3 py-2 text-sm text-[#141A24] leading-relaxed outline-none resize-none transition focus:ring-2 focus:ring-[#0078FF]/40 placeholder:text-[#99A1B1] disabled:opacity-60 ${
              errors.bio ? "border-[#FF3A5B]" : "border-[#E5E8EF] focus:border-[#0078FF]"
            }`}
          />
        </Field>

        <button
          type="submit"
          disabled={isSaving || !isDirty}
          className="h-11 rounded-[12px] bg-[#0078FF] hover:bg-[#0066DB] text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition shadow-xs socar-press active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              중복 확인 및 저장 중...
            </>
          ) : isDirty ? (
            <>
              <Check className="w-4 h-4" />
              {isSaved ? "변경사항 저장" : "프로필 저장"}
            </>
          ) : (
            "변경사항 없음"
          )}
        </button>
      </form>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  counter,
  current,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  counter?: string;
  /** 현재 저장된 값 (입력란 위에 작게 표시) */
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-[#141A24]">
          {label}
        </label>
        <span className="flex items-baseline gap-2 min-w-0 text-[11px] text-[#99A1B1]">
          {current !== undefined && (
            <span className="truncate">
              현재: <span className="text-[#697383] font-medium">{current || "-"}</span>
            </span>
          )}
          {counter && <span className="shrink-0 tabular-nums">{counter}</span>}
        </span>
      </div>
      {children}
      {error ? (
        <p id={`${id}-help`} role="alert" className="text-[11px] text-[#FF3A5B] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-help`} className="text-[11px] text-[#99A1B1]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
