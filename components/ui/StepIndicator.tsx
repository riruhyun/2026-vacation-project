interface Step {
  label: string;
  status: "done" | "active" | "pending";
}

interface StepIndicatorProps {
  steps: Step[];
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="rounded-full border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-center gap-2 text-xs">
        {steps.map((step, index) => (
          <span key={step.label} className="flex items-center gap-2">
            {index > 0 && <span className="text-border">·</span>}
            <span
              className={
                step.status === "active"
                  ? "font-semibold text-primary"
                  : step.status === "done"
                    ? "text-muted"
                    : "text-muted/60"
              }
            >
              {step.label}
              {step.status === "done" && " ✓"}
              {step.status === "active" && " •"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
