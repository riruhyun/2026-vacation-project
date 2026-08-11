"use client";

import { useRouter } from "next/navigation";

interface IdentifyFlowHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export function IdentifyFlowHeader({
  title,
  subtitle,
  onBack,
}: IdentifyFlowHeaderProps) {
  const router = useRouter();

  return (
    <header className="mb-7">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack ?? (() => router.back())}
          aria-label="뒤로 가기"
          className="flex h-7 w-4 shrink-0 items-center justify-center text-[var(--color-deep-green)]"
        >
          <i className="ri-arrow-left-s-line text-[28px] leading-none" aria-hidden="true" />
        </button>
        <h1 className="m-0 text-[26px] font-extrabold leading-tight text-[var(--color-deep-green)]">
          {title}
        </h1>
      </div>
      <p className="mt-5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {subtitle}
      </p>
    </header>
  );
}
