import { RiUser3Fill } from "@remixicon/react";
import PageHeader from "@/components/layout/PageHeader";
import ProgressBar from "@/components/home/ProgressBar";
import type { ProfilePageData } from "@/types/user";
import SignOutButton from "./SignOutButton";

export default function ProfileScreen({ data }: { data: ProfilePageData }) {
  const { profile, stats, recentActivities, levelTitle } = data;

  const cards = [
    { label: "공식 발견", value: stats.officialPlants },
    { label: "관찰 기록", value: stats.totalObservations },
    { label: "현재 레벨", value: profile.level },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="마이페이지" />
      {/* TODO: 백엔드 프로필 수정 범위가 확정되면 설정 진입점을 복원한다. */}

      <section className="-mt-4 flex items-center gap-3.5">
        <div className="flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] bg-[var(--color-primary)] text-[var(--color-surface)]">
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
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xl font-bold text-[var(--color-text)]">
            {profile.nickname ?? "식물 탐험가"}
          </p>
          <p className="mb-2 text-sm font-bold text-[var(--color-primary)]">
            Lv. {profile.level} {levelTitle}
          </p>
          <ProgressBar value={profile.currentLevelXp} max={profile.xpToNextLevel} label="레벨 진행도" />
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            {profile.currentLevelXp} / {profile.xpToNextLevel} XP
          </p>
        </div>
      </section>

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
