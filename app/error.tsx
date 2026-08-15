"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[var(--color-text)]">문제가 발생했어요</h2>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {error.message || "잠시 후 다시 시도해 주세요."}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-[var(--radius-control)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-surface)]"
      >
        다시 시도
      </button>
    </div>
  );
}
