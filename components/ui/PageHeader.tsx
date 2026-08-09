"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, onBack }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="mb-6">
      <div className="mb-4 flex items-start gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-mint"
          aria-label="뒤로 가기"
        >
          <i className="ri-arrow-left-s-line text-2xl leading-none" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-primary">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
