import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import PlantCard from "@/components/plants/PlantCard";
import { mockCollectedPlants, mockUserProgress } from "@/data/mock-plants";

const RECENT_IMAGES = [
  "/plants/example1.jpg",
  "/plants/example2.webp",
  "/plants/example3.jpg",
];

export default function HomeScreen() {
  const { nickname, levelTitle, level, xpToNextLevel, currentXp } = mockUserProgress;
  const xpPerLevel = 400;
  const xpPercent = Math.round(((xpPerLevel - xpToNextLevel) / xpPerLevel) * 100);
  const recentCollected = mockCollectedPlants.slice(0, 3);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`안녕하세요, ${nickname}님`}
        subtitle="오늘도 새로운 초록을 만나볼까요?"
      />

      <div className="rounded-[20px] bg-[var(--color-deep)] p-5">
        <p className="m-0 text-sm font-semibold text-[var(--color-lime)]">
          Lv. {level} {levelTitle}
        </p>
        <p
          style={{ color: "var(--color-white)" }}
          className="m-0 mt-1.5 mb-3 text-xl font-bold"
        >
          다음 레벨까지 {xpToNextLevel} XP
        </p>
        <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#315B48]">
          <div
            className="h-2 rounded-[4px] bg-[var(--color-lime)] transition-[width] duration-300"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p style={{ color: "var(--color-white)" }} className="m-0 mt-2 text-xs opacity-70">
          누적 {currentXp} XP
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[var(--color-primary)] px-5 py-6">
        <p
          style={{ color: "var(--color-white)" }}
          className="m-0 text-xl font-bold leading-[1.4]"
        >
          지금 보이는 식물을
          <br />
          카드로 남겨보세요
        </p>
        <Link
          href="/capture"
          style={{ color: "var(--color-deep)" }}
          className="whitespace-nowrap rounded-2xl bg-[var(--color-lime)] px-4 py-2 text-xs font-semibold"
        >
          촬영하기
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-lg font-bold text-[var(--color-text)]">최근 수집</h2>
          <Link href="/collection" className="text-xs font-semibold text-[var(--color-primary)]">
            전체 보기
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {recentCollected.map((plant, index) => (
            <PlantCard
              key={plant.slug}
              slug={plant.slug}
              koreanName={plant.koreanName}
              rarity={plant.rarity}
              imageUrl={RECENT_IMAGES[index]}
            />
          ))}
        </div>
      </div>

      <div className="rounded-[20px] bg-[#EEF3EA] px-[18px] py-4">
        <p className="m-0 text-xs font-bold text-[var(--color-primary)]">촬영 팁</p>
        <p className="m-0 mt-1.5 text-xs font-normal leading-[1.5] text-[var(--color-sub)]">
          식물 한 개체가 화면 중앙에 오면 더 잘 찾아요.
        </p>
      </div>
    </div>
  );
}
