// 공통 컴포넌트: 버튼
// variant: primary(딥그린, ex. "선택한 식물로 카드 만들기"), accent(라이트그린, ex. "촬영하기")
// 눌림 인터랙션(onMouseDown/Up)이 있어 클라이언트 컴포넌트로 선언

"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_STYLE: Record<ButtonVariant, { background: string; color: string; border?: string }> = {
  primary: { background: "var(--color-deep-green)", color: "#ffffff" },
  accent: { background: "var(--color-accent)", color: "var(--color-deep-green)" },
  outline: {
    background: "transparent",
    color: "var(--color-deep-green)",
    border: "1.5px solid var(--color-deep-green)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-deep-green)",
  },
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  style,
  ...rest
}: ButtonProps) {
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <button
      {...rest}
      style={{
        width: fullWidth ? "100%" : undefined,
        background: variantStyle.background,
        color: variantStyle.color,
        border: variantStyle.border ?? "none",
        borderRadius: "var(--radius-button)",
        padding: "16px 24px",
        fontSize: "16px",
        fontWeight: 700,
        cursor: "pointer",
        transition: "opacity 0.15s ease, transform 0.1s ease",
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}
