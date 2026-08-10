interface InfoBoxProps {
  children: React.ReactNode;
}

export function InfoBox({ children }: InfoBoxProps) {
  return (
    <div className="rounded-2xl bg-info-bg px-4 py-3 text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}
