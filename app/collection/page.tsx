import Link from "next/link";
import { PLANT_SPECIES } from "@/data/plant-species";

export default function CollectionPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight text-primary">내 식물 카드</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          지금은 예시 카드로 도감을 먼저 확인할 수 있어요.
        </p>
      </header>

      <div className="space-y-3">
        {PLANT_SPECIES.map((plant) => (
          <Link
            key={plant.id}
            href={`/plants/${plant.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="h-16 w-16 shrink-0 rounded-xl bg-mint object-contain p-2"
            />
            <div className="min-w-0">
              <p className="font-bold text-foreground">{plant.name}</p>
              {plant.scientificName && (
                <p className="mt-0.5 truncate text-xs italic text-muted">
                  {plant.scientificName}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">{plant.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/capture"
        className="mt-auto flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-light"
      >
        새 식물 채집하기
      </Link>
    </main>
  );
}
