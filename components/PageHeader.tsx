// 공통 컴포넌트: 페이지 제목
// 뒤로가기 화살표가 필요한 화면(식물 상세, 직접 검색 등)과 필요 없는 화면(홈, 도감) 모두 지원

"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    showBack?: boolean;
    action?: ReactNode; // 우측 액션 (ex. "검색" 버튼)
}

export default function PageHeader({ title, showBack = false, action }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                minHeight: "36px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {showBack && (
                    <button
                        onClick={() => router.back()}
                        aria-label="뒤로 가기"
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            color: "var(--color-text-primary)",
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                )}
                <h1
                    style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--color-text-primary)",
                    }}
                >
                    {title}
                </h1>
            </div>
            {action}
        </div>
    );
}