import { getOfficialPlant } from "../../../data/official-plants";
import { errorMessage, fail, ok } from "../../../lib/server/http";
import { getForestPlant } from "../../../lib/server/forest";
import { imageError } from "../../../lib/server/image";
import type { IdentifyResponseDto } from "../../../types/identify";

export const runtime = "nodejs";

type PlantNetResult = {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    commonNames?: string[];
    family?: { scientificNameWithoutAuthor?: string };
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

    if (!(image instanceof File)) return fail("image 파일이 필요합니다.");

    const validationError = imageError(image);
    if (validationError) return fail(validationError);

    const apiKey = process.env.PLANTNET_API_KEY;
    if (!apiKey) return fail("PLANTNET_API_KEY가 설정되지 않았습니다.", 500);

    const plantNetForm = new FormData();
    plantNetForm.append("images", image, image.name || "plant.jpg");

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

    const results = (body.results || []).slice(0, 3);
    const forestPlants = await Promise.all(
      results.map((item) =>
        getOfficialPlant(item.species.scientificNameWithoutAuthor)
          ? getForestPlant(item.species.scientificNameWithoutAuthor).catch(
              () => null,
            )
          : null,
      ),
    );

    const candidates = results.map((item, index) => {
      const scientificName = item.species.scientificNameWithoutAuthor;
      const relatedImage = item.images?.[0];
      const forestPlant = forestPlants[index];

      const official = getOfficialPlant(scientificName);

      return {
        plantId: official?.id ?? null,
        official: Boolean(official),
        matchType: official ? ("exact" as const) : null,
        koreanName:
          forestPlant?.koreanName ||
          official?.koreanName ||
          item.species.commonNames?.[0] ||
          scientificName,
        description: forestPlant?.description || null,
        scientificName,
        scientificNameWithAuthor: item.species.scientificName,
        family: item.species.family?.scientificNameWithoutAuthor || null,
        score: item.score,
        stage: official?.stage ?? null,
        rarity: official?.rarity ?? null,
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
