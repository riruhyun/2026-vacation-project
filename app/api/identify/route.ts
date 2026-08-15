import { matchCollectionCard } from "@/lib/collection-card-matching";
import { PLANT_ORGANS } from "@/types/domain";
import {
  getCollectionCatalog,
} from "@/lib/server/collection-cards";
import {
  getForestPlant,
  getForestPlantByNumber,
} from "@/lib/server/forest";
import { errorMessage, fail, ok } from "@/lib/server/http";
import { imageError } from "@/lib/server/image";
import type { IdentifyResponseDto } from "@/types/identify";

const PLANTNET_ORGANS = PLANT_ORGANS.filter((organ) => organ !== "auto");

export const runtime = "nodejs";

type PlantNetResult = {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    commonNames?: string[];
    family?: { scientificNameWithoutAuthor?: string };
    genus?: { scientificNameWithoutAuthor?: string };
  };
  images?: Array<{
    url?: { o?: string; m?: string; s?: string };
    citation?: string;
    author?: string;
    license?: string;
  }>;
};

type PlantNetResponse = {
  results?: PlantNetResult[];
  remainingIdentificationRequests?: number;
  message?: string;
};

export async function POST(request: Request) {
  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("multipart/form-data 형식이 필요합니다.");
    }

    const image = form.get("image");
    const organ = form.get("organ");

    if (!(image instanceof File)) return fail("image 파일이 필요합니다.");
    if (
      organ !== null &&
      (typeof organ !== "string" ||
        (organ !== "auto" && !PLANTNET_ORGANS.some((value) => value === organ)))
    ) {
      return fail("지원하지 않는 식물 부위입니다.", 400);
    }

    const validationError = imageError(image);
    if (validationError) return fail(validationError);

    const apiKey = process.env.PLANTNET_API_KEY;
    if (!apiKey) return fail("PLANTNET_API_KEY가 설정되지 않았습니다.", 500);

    const plantNetForm = new FormData();
    plantNetForm.append("images", image, image.name || "plant.jpg");
    if (typeof organ === "string" && organ !== "auto") {
      plantNetForm.append("organs", organ);
    }

    const url = new URL("https://my-api.plantnet.org/v2/identify/all");
    url.searchParams.set("api-key", apiKey);
    url.searchParams.set("nb-results", "3");
    url.searchParams.set("include-related-images", "true");

    const response = await fetch(url, { method: "POST", body: plantNetForm });
    const body = (await response.json().catch(() => ({}))) as PlantNetResponse;

    if (response.status === 404) {
      return fail("사진에서 식물을 식별하지 못했습니다.", 422);
    }

    if (!response.ok) {
      return fail(body.message || "식물 식별에 실패했습니다.", 502);
    }

    const { cards, matchers } = await getCollectionCatalog();
    const matchedResults = (body.results || []).map((item) => {
      const scientificName = item.species.scientificNameWithoutAuthor;
      const genusName =
        item.species.genus?.scientificNameWithoutAuthor ||
        scientificName.split(/\s+/)[0] ||
        null;

      return {
        item,
        scientificName,
        genusName,
        match: matchCollectionCard(
          cards,
          matchers,
          scientificName,
          genusName,
        ),
      };
    });
    const seen = new Set<string>();
    const results = matchedResults.filter(({ match, scientificName }) => {
      const key = match
        ? `card:${match.card.id}`
        : `species:${scientificName.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
    const forestPlants = await Promise.all(
      results.map(({ match, scientificName }) => {
        const request = match?.card.representativePlantPilbkNo
          ? getForestPlantByNumber(match.card.representativePlantPilbkNo)
          : getForestPlant(scientificName);
        return request.catch(() => null);
      }),
    );

    const candidates = results.map((result, index) => {
      const { item, scientificName, genusName, match } = result;
      const relatedImage = item.images?.[0];
      const forestPlant = forestPlants[index];

      return {
        plantId: match?.card.id ?? null,
        official: Boolean(match),
        matchType: match?.matchType ?? null,
        koreanName:
          match?.card.displayName ||
          forestPlant?.koreanName ||
          item.species.commonNames?.[0] ||
          scientificName,
        description: forestPlant?.description || null,
        scientificName,
        scientificNameWithAuthor: item.species.scientificName,
        genusName,
        family: item.species.family?.scientificNameWithoutAuthor || null,
        score: item.score,
        stage: match?.card.stage ?? null,
        rarity: match?.card.rarity ?? null,
        imageUrl:
          relatedImage?.url?.m || relatedImage?.url?.o || relatedImage?.url?.s || null,
        imageAttribution:
          relatedImage?.citation || relatedImage?.author || relatedImage?.license || null,
      };
    });

    const payload = {
      candidates,
      remainingRequests: body.remainingIdentificationRequests ?? null,
    } satisfies IdentifyResponseDto;

    return ok(payload);
  } catch (error) {
    return fail("식물 식별 중 오류가 발생했습니다.", 500, errorMessage(error));
  }
}
