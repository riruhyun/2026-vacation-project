// 공통 컴포넌트: 페이지 제목
// 뒤로가기 화살표가 필요한 화면(식물 상세, 직접 검색 등)과 필요 없는 화면(홈, 도감) 모두 지원

"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: ReactNode; // 우측 액션 (ex. "검색" 버튼)
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  action,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-5 mt-[38px] flex min-h-9 items-center justify-between">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                router.back();
              }
            }}
            aria-label="뒤로 가기"
            className="flex items-center p-1 text-[#203229]"
          >
            <i className="ri-arrow-left-s-line text-[24px] leading-none" aria-hidden="true" />
          </button>
        )}
        <div>
          <h1 className="m-0 text-2xl font-bold text-[var(--color-deep)]">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mt-1 text-sm font-normal leading-[1.5] text-[var(--color-sub)]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}