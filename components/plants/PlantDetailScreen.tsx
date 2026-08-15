import PageHeader from "@/components/layout/PageHeader";
import RarityBadge from "@/components/plants/RarityBadge";
import type { PlantDetailScreenData } from "@/types/plant";

export default function PlantDetailScreen({ data }: { data: PlantDetailScreenData }) {
  const subtitle = data.firstObservedAt
    ? `${new Date(data.firstObservedAt).toLocaleDateString("ko-KR")} 첫 발견 · 관찰 ${data.observationCount}회`
    : `관찰 ${data.observationCount}회`;
  const hasDescription = typeof data.description === "string" && data.description.trim().length > 0;
  const hasInformationSource =
    typeof data.informationSource === "string" && data.informationSource.trim().length > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={data.koreanName}
        subtitle={subtitle}
        showBack
      />

      <div className="h-[276px] w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-placeholder)]">
        {data.imageUrl ? (
          // User observation images can be local mock paths, data URLs, or remote URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.koreanName} className="h-full w-full object-cover" />
        ) : null}
      </div>

      {data.rarity ? <RarityBadge rarity={data.rarity} size="md" /> : null}

      <div>
        <h2 className="text-[28px] font-bold text-[var(--color-primary-strong)]">{data.koreanName}</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{data.scientificName}</p>
      </div>

      {hasDescription ? (
        <section className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-[18px]">
          <h3 className="text-sm font-bold text-[var(--color-text)]">주요 특징</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{data.description}</p>
        </section>
      ) : null}

      {hasInformationSource ? (
        <p className="rounded-[var(--radius-control)] bg-[var(--color-info-surface)] px-[18px] py-3.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
          정보 출처:{" "}
          {data.informationSourceUrl ? (
            <a
              href={data.informationSourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--color-primary)] underline"
            >
              {data.informationSource}
            </a>
          ) : (
            data.informationSource
          )}
          . 식용·약용 판단에는 사용하지 마세요.
        </p>
      ) : null}
    </div>
  );
}
