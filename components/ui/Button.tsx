"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]",
  secondary:
    "border border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]",
  ghost: "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-info-surface)]",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex min-h-[52px] items-center justify-center rounded-[var(--radius-control)] px-6 py-4 text-base font-bold transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${fullWidth ? "w-full" : ""} ${VARIANT_CLASS[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
