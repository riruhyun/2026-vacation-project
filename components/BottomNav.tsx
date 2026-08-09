// 공통 컴포넌트: 하단 내비게이션

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: (active: boolean) => string;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: "홈",
        href: "/",
        icon: (active) => (active ? "ri-home-5-fill" : "ri-home-5-line"),
    },
    {
        label: "도감",
        href: "/collection",
        icon: (active) => (active ? "ri-book-open-fill" : "ri-book-open-line"),
    },
    {
        label: "수집",
        href: "/capture",
        icon: (active) => (active ? "ri-camera-fill" : "ri-camera-line"),
    },
    {
        label: "프로필",
        href: "/profile",
        icon: (active) => (active ? "ri-user-3-fill" : "ri-user-3-line"),
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            style={{
                position: "sticky",
                bottom: 0,
                left: 0,
                right: 0,
                background: "var(--color-bg)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-around",
                padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
            }}
        >
            {NAV_ITEMS.map((item) => {
                const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 14px",
                            borderRadius: "var(--radius-pill)",
                            background: active ? "rgba(31,74,61,0.08)" : "transparent",
                        }}
                    >
                        <i
                            className={item.icon(active)}
                            aria-hidden="true"
                            style={{
                                fontSize: "22px",
                                lineHeight: 1,
                                color: active ? "var(--color-deep-green)" : "var(--color-text-muted)",
                            }}
                        />
                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: active ? 700 : 500,
                                color: active ? "var(--color-deep-green)" : "var(--color-text-muted)",
                            }}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}