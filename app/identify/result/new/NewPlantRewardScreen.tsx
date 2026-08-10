import Image from "next/image";
import Link from "next/link";
import { RARITY_LABEL } from "@/types/domain";
import IdentifyResultShell from "../IdentifyResultShell";
import type { NewPlantRewardViewModel } from "@/types/identify";
import RewardPlantCard from "./RewardPlantCard";
import styles from "./new-plant-reward.module.css";

interface NewPlantRewardScreenProps {
  reward: NewPlantRewardViewModel;
}

export default function NewPlantRewardScreen({
  reward,
}: NewPlantRewardScreenProps) {
  const totalXp = reward.baseXp + reward.rarityBonusXp;

  return (
    <IdentifyResultShell background="#173c2d" className={styles.screen}>
      <header className={styles.header}>
        <h1>새로운 식물 발견!</h1>
        <p>내 도감에 첫 {reward.koreanName}이 추가됐어요</p>
      </header>

      <Image
        className={styles.halo}
        src="/images/identify-result/new-reward-halo.svg"
        alt=""
        width={310}
        height={310}
        aria-hidden="true"
        unoptimized
      />

      <RewardPlantCard reward={reward} />

      <section className={styles.xpReward} aria-label="경험치 보상">
        <strong>+{totalXp} XP</strong>
        <span>
          새로운 종 {reward.baseXp} · {RARITY_LABEL[reward.rarity]} 등급 {reward.rarityBonusXp}
        </span>
      </section>

      <Link className={styles.primaryAction} href="/collection">
        도감에 저장하고 계속하기
      </Link>
    </IdentifyResultShell>
  );
}
