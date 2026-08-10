import type { ButtonHTMLAttributes, ReactNode } from "react";
import Button from "@/components/Button";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function SecondaryButton({ children, style, ...rest }: SecondaryButtonProps) {
  return (
    <Button
      {...rest}
      variant="ghost"
      fullWidth
      style={{
        padding: "12px 0",
        fontSize: "14px",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </Button>
  );
}
