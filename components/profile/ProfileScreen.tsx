"use client";

import { useRef, useState } from "react";
import { RiPencilFill, RiUser3Fill } from "@remixicon/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import ProgressBar from "@/components/home/ProgressBar";
import { updateProfile } from "@/lib/api";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_INPUT_ACCEPT,
  MAX_IMAGE_SIZE,
} from "@/lib/image-constraints";
import {
  NICKNAME_MAX_LENGTH,
  nicknameError,
  normalizeNickname,
} from "@/lib/nickname";
import type { ProfilePageData } from "@/types/user";
import SignOutButton from "./SignOutButton";

export default function ProfileScreen({ data }: { data: ProfilePageData }) {
  const { profile, stats, recentActivities, levelTitle } = data;
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [nicknameErrorMessage, setNicknameErrorMessage] = useState<string | null>(null);
  const [avatarErrorMessage, setAvatarErrorMessage] = useState<string | null>(null);

  const cards = [
    { label: "공식 발견", value: stats.officialPlants },
    { label: "관찰 기록", value: stats.totalObservations },
    { label: "현재 레벨", value: profile.level },
  ];

  function cancelNicknameEdit() {
    setNickname(profile.nickname ?? "");
    setNicknameErrorMessage(null);
    setIsEditingNickname(false);
  }

  async function saveNickname() {
    const normalizedNickname = normalizeNickname(nickname);
    const validationError = nicknameError(normalizedNickname);
    if (validationError) {
      setNicknameErrorMessage(validationError);
      return;
    }

    setIsSavingNickname(true);
    setNicknameErrorMessage(null);
    try {
      await updateProfile({ nickname: normalizedNickname });
      setIsEditingNickname(false);
      router.refresh();
    } catch (error) {
      setNicknameErrorMessage(
        error instanceof Error
          ? error.message
          : "사용자명 수정 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSavingNickname(false);
    }
  }

  async function uploadAvatar(file: File) {
    const isAllowedImage = ALLOWED_IMAGE_TYPES.some(
      (type) => type === file.type,
    );
    if (!isAllowedImage) {
      setAvatarErrorMessage("JPG 또는 PNG 이미지만 가능합니다.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setAvatarErrorMessage("이미지는 6MB 이하여야 합니다.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarErrorMessage(null);
    try {
      await updateProfile({ avatar: file });
      router.refresh();
    } catch (error) {
      setAvatarErrorMessage(
        error instanceof Error
          ? error.message
          : "프로필 사진 수정 중 오류가 발생했습니다.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="마이페이지" />

      <section className="-mt-4 flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={isUploadingAvatar}
          aria-label={
            isUploadingAvatar ? "프로필 사진 업로드 중" : "프로필 사진 변경"
          }
          className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-primary)] text-[var(--color-surface)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] disabled:cursor-wait"
        >
          {profile.avatarUrl ? (
            /* Supabase 스토리지의 공개 URL이라 next/image 원격 설정 없이 그대로 씁니다. */
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.avatarUrl}
              alt="프로필 사진"
              className="h-full w-full object-cover"
            />
          ) : (
            <RiUser3Fill size={32} aria-hidden="true" />
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-bold">
            {isUploadingAvatar ? "업로드 중" : "사진 변경"}
          </span>
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const [file] = event.target.files ?? [];
            event.currentTarget.value = "";
            if (file) void uploadAvatar(file);
          }}
        />
        <div className="min-w-0 flex-1">
          {isEditingNickname ? (
            <div className="mb-1">
              <label className="sr-only" htmlFor="profile-nickname">
                사용자명
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="profile-nickname"
                  value={nickname}
                  maxLength={NICKNAME_MAX_LENGTH}
                  autoFocus
                  disabled={isSavingNickname}
                  onChange={(event) => {
                    setNickname(event.target.value);
                    setNicknameErrorMessage(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void saveNickname();
                    if (event.key === "Escape") cancelNicknameEdit();
                  }}
                  className="min-w-0 flex-1 rounded-md border border-[var(--color-primary)] bg-[var(--color-surface)] px-2 py-1 text-xl font-bold text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => void saveNickname()}
                  disabled={isSavingNickname}
                  className="shrink-0 text-xs font-bold text-[var(--color-primary)] disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={cancelNicknameEdit}
                  disabled={isSavingNickname}
                  className="shrink-0 text-xs font-bold text-[var(--color-text-muted)] disabled:opacity-50"
                >
                  취소
                </button>
              </div>
              {nicknameErrorMessage ? (
                <p role="alert" className="mt-1 text-xs font-semibold text-red-700">
                  {nicknameErrorMessage}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mb-1 flex items-center gap-1.5">
              <p className="min-w-0 truncate text-xl font-bold text-[var(--color-text)]">
                {profile.nickname ?? "식물 탐험가"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setNickname(profile.nickname ?? "");
                  setNicknameErrorMessage(null);
                  setIsEditingNickname(true);
                }}
                aria-label="사용자명 수정"
                className="shrink-0 text-[var(--color-text-muted)] outline-offset-2 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <RiPencilFill size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          <p className="mb-2 text-sm font-bold text-[var(--color-primary)]">
            Lv. {profile.level} {levelTitle}
          </p>
          <ProgressBar value={profile.currentLevelXp} max={profile.xpToNextLevel} label="레벨 진행도" />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {profile.currentLevelXp} / {profile.xpToNextLevel} XP
          </p>
        </div>
      </section>
      {avatarErrorMessage ? (
        <p role="alert" className="-mt-5 text-xs font-semibold text-red-700">
          {avatarErrorMessage}
        </p>
      ) : null}

      <section className="flex gap-2.5">
        {cards.map((card) => (
          <div key={card.label} className="flex h-[92px] flex-1 flex-col items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-surface)] text-center">
            <strong className="text-2xl text-[var(--color-primary-strong)]">{card.value}</strong>
            <span className="mt-1.5 text-xs text-[var(--color-text-muted)]">{card.label}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">최근 활동</h2>
        <div className="flex flex-col gap-3">
          {recentActivities.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">아직 활동 기록이 없어요.</p> : recentActivities.map((activity) => (
            <div key={activity.id} className="rounded-[var(--radius-control)] bg-[var(--color-surface)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">{activity.type === "new_plant" ? `${activity.displayName ?? "식물"} 발견` : `Lv. ${activity.level} 달성`}</p>
              <time className="text-xs text-[var(--color-text-muted)]" dateTime={activity.createdAt}>
                {new Date(activity.createdAt).toLocaleDateString("ko-KR")}
              </time>
            </div>
          ))}
        </div>
      </section>
      <SignOutButton />
    </div>
  );
}
