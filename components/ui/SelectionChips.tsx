import type { PlantPart } from "@/types/plant";

const PARTS: { value: PlantPart; label: string }[] = [
  { value: "auto", label: "자동" },
  { value: "flower", label: "꽃" },
  { value: "leaf", label: "잎" },
  { value: "fruit", label: "열매" },
];

interface SelectionChipsProps {
  value: PlantPart;
  onChange: (part: PlantPart) => void;
}

export function SelectionChips({ value, onChange }: SelectionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PARTS.map((part) => {
        const isActive = value === part.value;
        return (
          <button
            key={part.value}
            type="button"
            onClick={() => onChange(part.value)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "border border-border bg-surface text-muted hover:border-primary/30"
            }`}
          >
            {part.label}
          </button>
        );
      })}
    </div>
  );
}
