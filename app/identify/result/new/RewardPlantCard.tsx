import Image from "next/image";
import type { NewPlantRewardViewModel } from "../types";
import styles from "./new-plant-reward.module.css";

interface RewardPlantCardProps {
  reward: NewPlantRewardViewModel;
}

export default function RewardPlantCard({ reward }: RewardPlantCardProps) {
  return (
    <article
      className={styles.card}
      aria-label={`${reward.koreanName} 신규 카드`}
    >
      <div className={styles.photoFrame}>
        <Image
          src={reward.photoUrl}
          alt={`${reward.koreanName} 관찰 사진`}
          width={246}
          height={250}
          priority
          unoptimized
        />
      </div>
      <span className={styles.rarity}>{reward.rarity}</span>
      <h2>{reward.koreanName}</h2>
      <p className={styles.scientificName}>{reward.scientificName}</p>
      <p className={styles.discoveredAt}>{reward.discoveredAt} 첫 발견</p>
    </article>
  );
}
