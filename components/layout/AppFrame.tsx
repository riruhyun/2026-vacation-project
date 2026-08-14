"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

type AppFrameProps = {
  children: ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const isApiDocsRoute = pathname === "/api-docs";

  if (isApiDocsRoute) return children;

  return (
    <div className="app-shell">
      <main className={isLoginRoute ? "app-content app-content--auth" : "app-content"}>
        {children}
      </main>
      {!isLoginRoute ? <BottomNav /> : null}
    </div>
  );
}
