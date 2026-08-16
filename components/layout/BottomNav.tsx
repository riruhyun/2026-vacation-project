"use client";

import {
  RiBookOpenFill,
  RiBookOpenLine,
  RiCameraFill,
  RiCameraLine,
  RiHome5Fill,
  RiHome5Line,
  RiUser3Fill,
  RiUser3Line,
} from "@remixicon/react";
import type { RemixiconComponentType } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  activeIcon: RemixiconComponentType;
  inactiveIcon: RemixiconComponentType;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "홈",
    href: "/",
    activeIcon: RiHome5Fill,
    inactiveIcon: RiHome5Line,
  },
  {
    label: "도감",
    href: "/collection",
    activeIcon: RiBookOpenFill,
    inactiveIcon: RiBookOpenLine,
  },
  {
    label: "수집",
    href: "/capture",
    activeIcon: RiCameraFill,
    inactiveIcon: RiCameraLine,
  },
  {
    label: "프로필",
    href: "/profile",
    activeIcon: RiUser3Fill,
    inactiveIcon: RiUser3Line,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/collection") {
      return ["/collection", "/plants", "/findings"].some(
        (route) => pathname.startsWith(route),
      );
    }
    if (href === "/capture") {
      return pathname.startsWith("/capture") || pathname.startsWith("/identify");
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-1/2 bottom-0 z-50 flex w-[min(100vw,480px)] -translate-x-1/2 justify-around border-t border-[var(--color-border)] bg-[var(--color-background)] px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = active ? item.activeIcon : item.inactiveIcon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-1 rounded-[var(--radius-pill)] px-3.5 py-1.5 ${active ? "bg-[var(--color-info-surface)]" : ""}`}
          >
            <Icon
              size={22}
              aria-hidden="true"
              className={active ? "text-[var(--color-primary-strong)]" : "text-[var(--color-text-muted)]"}
            />
            <span className={`text-xs ${active ? "font-bold text-[var(--color-primary-strong)]" : "font-medium text-[var(--color-text-muted)]"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
