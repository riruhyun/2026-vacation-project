import type { PlantCandidate } from "@/types/plant";

interface CandidateCardProps {
  candidate: PlantCandidate;
  selected: boolean;
  onSelect: () => void;
}

export function CandidateCard({ candidate, selected, onSelect }: CandidateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border-2 p-4 text-left transition-colors ${
        selected
          ? "border-primary bg-mint"
          : "border-border bg-surface hover:border-primary/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mint">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={candidate.imageUrl}
            alt={candidate.name}
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">{candidate.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                selected
                  ? "bg-primary text-white"
                  : "bg-border text-muted"
              }`}
            >
              {candidate.confidence}%
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{candidate.description}</p>
          <p className="mt-2 text-xs font-medium text-primary">
            {selected ? "선택됨" : "비교하기 >"}
          </p>
        </div>
      </div>
    </button>
  );
}
