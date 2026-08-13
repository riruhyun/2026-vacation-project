interface ProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label = "진행률",
}: ProgressBarProps) {
  const resolvedValue = value ?? 0;
  const clamped = Math.min(100, Math.max(0, (resolvedValue / max) * 100));

  return (
    <div
      aria-label={label}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={Math.min(max, Math.max(0, resolvedValue))}
      className="h-2 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-border)]"
      role="progressbar"
    >
      <div
        style={{ width: `${clamped}%` }}
        className="h-full rounded-[var(--radius-pill)] bg-[var(--color-primary)] transition-[width] duration-300"
      />
    </div>
  );
}
