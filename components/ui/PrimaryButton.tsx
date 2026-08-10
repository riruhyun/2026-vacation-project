import type { ButtonHTMLAttributes, ReactNode } from "react";
import Button from "@/components/Button";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PrimaryButton({ children, ...rest }: PrimaryButtonProps) {
  return (
    <Button {...rest} variant="primary" fullWidth>
      {children}
    </Button>
  );
}
