import type { CSSProperties, ReactNode } from "react";

interface IdentifyResultShellProps {
  background: string;
  children: ReactNode;
  className?: string;
}

const shellStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  overflowY: "auto",
  overscrollBehaviorY: "contain",
};

const viewportStyle: CSSProperties = {
  width: "100%",
  maxWidth: "390px",
  minHeight: "100dvh",
  margin: "0 auto",
};

export default function IdentifyResultShell({
  background,
  children,
  className,
}: IdentifyResultShellProps) {
  return (
    <div style={{ ...shellStyle, background }}>
      <div className={className} style={{ ...viewportStyle, background }}>
        {children}
      </div>
    </div>
  );
}
