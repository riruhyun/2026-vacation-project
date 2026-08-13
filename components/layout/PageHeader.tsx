"use client";

import { RiArrowLeftSLine } from "@remixicon/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  variant?: "default" | "identify";
  showBack?: boolean;
  onBack?: () => void;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  variant = "default",
  showBack = false,
  onBack,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={`mb-5 flex min-h-9 items-center justify-between ${variant === "identify" ? "mt-6" : "mt-[38px]"}`}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                router.back();
              }
            }}
            aria-label="뒤로 가기"
            className="flex items-center rounded-full p-1 text-[var(--color-text)] transition hover:bg-[var(--color-info-surface)]"
          >
            <RiArrowLeftSLine size={24} aria-hidden="true" />
          </button>
        )}
        <div>
          <h1 className="m-0 text-2xl font-bold text-[var(--color-primary-strong)]">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mt-1 text-sm font-normal leading-[1.5] text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
