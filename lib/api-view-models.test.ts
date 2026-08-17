import { describe, expect, it } from "vitest";
import { buildFindingDetailData } from "@/lib/api-view-models";
import type { CollectionResponseDto } from "@/types/plant";

const SOURCE = "산림청 국립수목원";

const collection: CollectionResponseDto = {
  summary: { total: 50, collected: 1, totalObservations: 4, completionRate: 2 },
  officialPlants: [],
  otherFindings: [
    {
      scientificName: "Taraxacum officinale",
      displayName: "Taraxacum officinale",
      observationCount: 3,
      representativeImageUrl: "https://example.com/a.jpg",
      lastObservedAt: "2026-08-01T00:00:00.000Z",
    },
  ],
};

describe("buildFindingDetailData", () => {
  it("returns null when the finding is not in the collection", () => {
    expect(buildFindingDetailData("Zea mays", collection)).toBeNull();
  });

  it("matches the scientific name regardless of case and padding", () => {
    expect(
      buildFindingDetailData("  taraxacum OFFICINALE  ", collection),
    ).not.toBeNull();
  });

  it("keeps the stored name and shows no description when 산림청 has nothing", () => {
    const data = buildFindingDetailData("Taraxacum officinale", collection, null);

    expect(data?.koreanName).toBe("Taraxacum officinale");
    expect(data?.description).toBeNull();
    expect(data?.informationSource).toBeNull();
    expect(data?.informationSourceUrl).toBeUndefined();
  });

  it("behaves the same when 산림청 data is omitted entirely", () => {
    expect(buildFindingDetailData("Taraxacum officinale", collection)).toEqual(
      buildFindingDetailData("Taraxacum officinale", collection, null),
    );
  });

  it("applies the Korean name and description when 산림청 has the plant", () => {
    const data = buildFindingDetailData("Taraxacum officinale", collection, {
      koreanName: "서양민들레",
      description: "여러해살이풀로 잎은 뿌리에서 모여 난다.",
    });

    expect(data?.koreanName).toBe("서양민들레");
    expect(data?.description).toBe("여러해살이풀로 잎은 뿌리에서 모여 난다.");
    // 공식 식물과 같은 출처 표기를 씁니다.
    expect(data?.informationSource).toBe(SOURCE);
    expect(data?.informationSourceUrl).toBe(
      "https://www.data.go.kr/data/15143513/openapi.do",
    );
    // 기타 발견이라는 사실은 그대로여야 합니다.
    expect(data?.official).toBe(false);
    expect(data?.rarity).toBeNull();
    expect(data?.observationCount).toBe(3);
  });

  it("uses the Korean name even when only the description is missing", () => {
    const data = buildFindingDetailData("Taraxacum officinale", collection, {
      koreanName: "서양민들레",
      description: null,
    });

    expect(data?.koreanName).toBe("서양민들레");
    // 설명이 없으면 출처를 붙이지 않습니다. 근거로 보여줄 내용이 없기 때문입니다.
    expect(data?.informationSource).toBeNull();
  });

  it("treats blank 산림청 values as missing", () => {
    const data = buildFindingDetailData("Taraxacum officinale", collection, {
      koreanName: "   ",
      description: "\n  \t ",
    });

    expect(data?.koreanName).toBe("Taraxacum officinale");
    expect(data?.description).toBeNull();
    expect(data?.informationSource).toBeNull();
  });

  it("prefers the 산림청 name over a Korean name saved at observation time", () => {
    const withKoreanDisplayName: CollectionResponseDto = {
      ...collection,
      otherFindings: [{ ...collection.otherFindings[0], displayName: "민들레" }],
    };
    const data = buildFindingDetailData(
      "Taraxacum officinale",
      withKoreanDisplayName,
      { koreanName: "서양민들레", description: "설명" },
    );

    expect(data?.koreanName).toBe("서양민들레");
    // 학명은 화면에 함께 표시되므로 저장된 값을 그대로 유지합니다.
    expect(data?.scientificName).toBe("Taraxacum officinale");
  });
});
