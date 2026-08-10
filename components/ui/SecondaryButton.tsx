interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function SecondaryButton({ children, onClick }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 text-center text-sm font-medium text-primary transition-colors hover:text-primary-light"
    >
      {children}
    </button>
  );
}
