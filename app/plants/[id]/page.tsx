import Link from "next/link";
import { notFound } from "next/navigation";
import { PLANT_SPECIES } from "@/data/plant-species";

interface PlantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { id } = await params;
  const plant = PLANT_SPECIES.find((item) => item.id === id);

  if (!plant) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 py-6">
      <Link
        href="/collection"
        className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-mint"
        aria-label="뒤로 가기"
      >
        <span aria-hidden="true">‹</span>
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plant.imageUrl}
          alt={plant.name}
          className="mx-auto h-40 w-40 object-contain"
        />
        <h1 className="mt-6 text-2xl font-bold text-primary">{plant.name}</h1>
        {plant.scientificName && (
          <p className="mt-1 text-sm italic text-muted">{plant.scientificName}</p>
        )}
        <p className="mt-4 rounded-xl bg-mint px-4 py-3 text-sm leading-relaxed text-foreground">
          {plant.description}
        </p>
      </div>

      <Link
        href="/capture"
        className="mt-auto flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-primary-light"
      >
        다른 식물 채집하기
      </Link>
    </main>
  );
}
