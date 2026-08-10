// TODO: mockUserProgress -> GET /api/profile, mockCollectedPlants -> GET /api/collection

import Link from "next/link";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/home/ProgressBar";
import PlantCard from "@/components/plants/PlantCard";
import { mockUserProgress, mockCollectedPlants } from "@/data/mock-plants";

export default function HomePage() {
  const { nickname, levelTitle, level, xpToNextLevel, currentXp } = mockUserProgress;

  // XP 진행률 계산 (더미: 임시로 다음 레벨까지 총 필요 XP를 400으로 가정)
  const xpPerLevel = 400;
  const xpPercent = Math.round(
    ((xpPerLevel - xpToNextLevel) / xpPerLevel) * 100
  );

  const recentCollected = mockCollectedPlants.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
          안녕하세요, {nickname}님
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            margin: "6px 0 0",
          }}
        >
          오늘도 새로운 초록을 만나볼까요?
        </p>
      </div>

      <div
        style={{
          background: "var(--color-deep-green)",
          borderRadius: "var(--radius-card)",
          padding: "20px",
          color: "#ffffff",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            margin: 0,
            opacity: 0.85,
          }}
        >
          Lv. {level} {levelTitle}
        </p>
        <p style={{ fontSize: "19px", fontWeight: 800, margin: "6px 0 12px" }}>
          다음 레벨까지 {xpToNextLevel} XP
        </p>
        <ProgressBar percent={xpPercent} />
        <p
          style={{
            fontSize: "12px",
            margin: "8px 0 0",
            opacity: 0.7,
          }}
        >
          누적 {currentXp} XP
        </p>
      </div>

      <div
        style={{
          background: "var(--color-deep-green)",
          borderRadius: "var(--radius-card)",
          padding: "24px 20px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <p
          style={{
            fontSize: "18px",
            fontWeight: 800,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          지금 보이는 식물을
          <br />
          카드로 남겨보세요
        </p>
        <Link href="/capture">
          <Button variant="accent" style={{ whiteSpace: "nowrap" }}>
            촬영하기
          </Button>
        </Link>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>
            최근 수집
          </h2>
          <Link
            href="/collection"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-deep-green)",
            }}
          >
            전체 보기
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {recentCollected.map((plant) => (
            <PlantCard
              key={plant.speciesId}
              speciesId={plant.speciesId}
              koreanName={plant.koreanName}
              rarity={plant.rarity}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>
          촬영 팁
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-secondary)",
            margin: "6px 0 0",
            lineHeight: 1.5,
          }}
        >
          식물 한 개체가 화면 중앙에 오면 더 잘 찾아요.
        </p>
      </div>
    </div>
  );
}