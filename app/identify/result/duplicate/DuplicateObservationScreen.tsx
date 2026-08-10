import Image from "next/image";
import Link from "next/link";
import IdentifyResultShell from "../IdentifyResultShell";
import type { DuplicateObservationViewModel } from "@/types/identify";
import styles from "./duplicate-observation.module.css";

interface DuplicateObservationScreenProps {
  observation: DuplicateObservationViewModel;
}

export default function DuplicateObservationScreen({
  observation,
}: DuplicateObservationScreenProps) {
  return (
    <IdentifyResultShell background="#f7f8f2" className={styles.screen}>
      <header className={styles.header}>
        <Link
          className={styles.backLink}
          href="/identify?step=candidates"
          aria-label="후보 선택으로 돌아가기"
        >
          ‹
        </Link>
        <h1>또 만났네요!</h1>
        <p>이미 수집한 식물도 새로운 관찰 기록으로 남길 수 있어요.</p>
      </header>

      <div className={styles.photoFrame}>
        <Image
          src={observation.photoUrl}
          alt={`${observation.koreanName} 관찰 사진`}
          width={294}
          height={270}
          priority
          unoptimized
        />
      </div>

      <section className={styles.identity}>
        <h2>{observation.koreanName}</h2>
        <div className={styles.badges}>
          <span>{observation.observationCount}번째 관찰</span>
          <strong>+{observation.rewardXp} XP</strong>
        </div>
      </section>

      <section className={styles.summary}>
        <h3>이번 기록에 추가되는 정보</h3>
        <ul>
          <li>{observation.observedAt} 관찰 사진</li>
          {observation.canReplaceCoverPhoto ? (
            <li>대표 사진으로 변경 가능</li>
          ) : null}
          <li>중복 관찰 보상 +{observation.rewardXp} XP</li>
        </ul>
      </section>

      <Link
        className={styles.primaryAction}
        href={`/plants/${observation.slug}`}
      >
        관찰 기록 추가
      </Link>
      <Link className={styles.secondaryAction} href="/capture">
        사진만 바꾸고 저장하지 않기
      </Link>
    </IdentifyResultShell>
  );
}
