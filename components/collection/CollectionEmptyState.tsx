"use client";

import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

export default function CollectionEmptyState() {
  return (
    <div className="flex min-h-full flex-col gap-12">
      <PageHeader title="나의 식물 도감" subtitle="아직 등록한 식물이 없어요." />

      <div className="mt-10 flex flex-col items-center gap-14">
        <div className="flex h-[190px] w-[190px] items-center justify-center rounded-full bg-[#DDEFE3]">
          <Image
            src="/images/plant-illust.png"
            alt=""
            width={110}
            height={110}
            aria-hidden="true"
          />
        </div>

        <div className="text-center">
          <h2 className="m-0 text-xl font-bold text-[var(--color-deep)]">
            첫 식물을 만나러 가볼까요?
          </h2>
          <p className="m-0 mt-[10px] text-sm font-normal leading-[1.6] text-[var(--color-sub)]">
            학교 화단이나 집 앞 가로수도
            <br />
            멋진 첫 발견이 될 수 있어요.
          </p>
        </div>
      </div>

      <div className="rounded-[20px] bg-[var(--color-white)] px-[18px] py-4">
        <p className="m-0 text-sm font-bold text-[var(--color-primary)]">첫 수집 추천</p>
        <p className="m-0 mt-2 mb-1 text-sm font-semibold text-[var(--color-text)]">
          민들레 · 토끼풀 · 은행나무처럼
        </p>
        <p className="m-0 text-xs font-normal text-[var(--color-sub)]">
          가까이에서 흔히 만나는 식물부터 시작해보세요.
        </p>
      </div>

      <Link
        href="/capture"
        style={{ color: "var(--color-white)" }}
        className="mt-auto flex h-[54px] w-full items-center justify-center rounded-[18px] bg-[var(--color-primary)] text-base font-semibold"
      >
        첫 식물 촬영하기
      </Link>
    </div>
  );
}
