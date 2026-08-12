"use client";

import { useRouter } from "next/navigation";
import PageHeader from "../../components/layout/PageHeader";

const RETRY_TIPS = [
  { index: 1, title: "꽃", description: "꽃잎과 중심을 가까이" },
  { index: 2, title: "잎", description: "잎맥과 가장자리를 선명하게" },
  { index: 3, title: "전체", description: "줄기와 전체 형태가 보이게" },
];

export function FailedScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="식별하기 어려워요"
        subtitle="사진에서 충분한 특징을 찾지 못했습니다."
        showBack
        onBack={() => router.push("/capture")}
      />

      <section className="flex flex-col items-center pt-11 text-center">
        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-[#EEF3EA]">
          <span className="text-[58px] font-bold leading-none text-[var(--color-primary)]">
            ?
          </span>
        </div>

        <h2 className="mt-9 text-[22px] font-bold leading-tight text-[var(--color-deep)]">
          다른 특징을 보여주세요
        </h2>
        <p className="mt-5 max-w-[260px] text-sm font-normal leading-relaxed text-[var(--color-sub)]">
          한 장의 사진보다 서로 다른 부위가 보이면 후보를 찾을 가능성이 높아져요.
        </p>
      </section>

      <div className="mt-12 space-y-3">
        {RETRY_TIPS.map((tip) => (
          <div
            key={tip.index}
            className="flex items-center rounded-[18px] bg-[var(--color-white)] px-4 py-3"
          >
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-[#DDEFE3] text-xs font-bold text-[var(--color-primary)]">
              {tip.index}
            </span>
            <strong className="ml-5 w-10 text-sm font-bold text-[var(--color-text)]">
              {tip.title}
            </strong>
            <span className="ml-5 text-xs font-normal text-[var(--color-sub)]">
              {tip.description}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-3 pt-8">
        <button
          type="button"
          onClick={() => router.push("/capture")}
          style={{ color: "var(--color-white)" }}
          className="flex h-[54px] w-full items-center justify-center rounded-[20px] bg-[var(--color-primary)] text-base font-semibold"
        >
          사진 추가해서 다시 분석
        </button>
        <button
          type="button"
          onClick={() => router.push("/search")}
          className="w-full py-3 text-center text-xs font-semibold text-[var(--color-primary)]"
        >
          직접 이름 검색하기
        </button>
      </div>
    </div>
  );
}