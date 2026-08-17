import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import ProgressBar from "@/components/home/ProgressBar";
import type { HomeData } from "@/types/user";

export default function HomeScreen({ data }: { data: HomeData }) {
  const { profile, levelTitle, recentPlants } = data;
  const remainingXp = Math.max(profile.xpToNextLevel - profile.currentLevelXp, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`안녕하세요, ${profile.nickname ?? "탐험가"}님`}
        subtitle="오늘은 새로운 초록을 만나볼까요?"
      />

      <section className="rounded-[var(--radius-card)] bg-[var(--color-primary-strong)] p-5 text-[var(--color-surface)]">
        <p className="text-sm font-semibold text-[var(--color-accent)]">
          Lv. {profile.level} {levelTitle}
        </p>
        <p className="mb-3 mt-1.5 text-xl font-bold">
          다음 레벨까지 {remainingXp} XP
        </p>
        <ProgressBar value={profile.currentLevelXp} max={profile.xpToNextLevel} label="레벨 진행도" />
        <p className="mt-2 text-xs opacity-70">누적 {profile.xp} XP</p>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--color-primary)] px-5 py-6 text-[var(--color-surface)]">
        <p className="text-xl font-bold leading-snug">
          지금 보이는 식물을
          <br />
          도감에 담아보세요
        </p>
        <Link
          href="/capture"
          className="whitespace-nowrap rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-black"
        >
          촬영하기
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text)]">최근 관찰</h2>
          <Link href="/collection" className="text-xs font-semibold text-[var(--color-primary)]">
            전체 보기
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {recentPlants.slice(0, 3).map((plant) => {
            const official = "id" in plant;
            const href = official
              ? `/plants/${plant.id}`
              : `/findings/${encodeURIComponent(plant.scientificName)}`;
            const name = official ? plant.koreanName : plant.displayName;
            return (
              <PlantCard
                key={href}
                id={official ? plant.id : undefined}
                koreanName={name}
                scientificName={plant.scientificName}
                rarity={official ? plant.rarity : undefined}
                imageUrl={plant.representativeImageUrl ?? undefined}
                href={href}
                size="sm"
              />
            );
          })}
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] bg-[var(--color-info-surface)] px-[18px] py-4">
        <p className="text-xs font-bold text-[var(--color-primary)]">촬영 팁</p>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
          식물 한 개체가 화면 중앙에 선명하게 보이도록 찍어보세요.
        </p>
      </section>
    </div>
  );
}
