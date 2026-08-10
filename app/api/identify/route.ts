import { errorMessage, fail, ok } from "@/lib/server/http";
import { imageError } from "@/lib/server/image";
import { supabase } from "@/lib/server/supabase";
import type { IdentifyResponse, RarityCode } from "@/types/plant";

export const runtime = "nodejs";

type PlantRow = {
  id: number;
  korean_name: string;
  scientific_name: string;
  rarity: RarityCode;
};

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

/**
 * 학명에서 속명을 뽑습니다. 'Taraxacum sect. Taraxacum' -> 'Taraxacum'
 * 속명은 대문자로 시작하는 한 단어라, 그 모양이 아니면 null을 반환해 폴백을 건너뜁니다.
 */
function genusOf(scientificName: string) {
  const first = scientificName.trim().split(/\s+/)[0] || "";
  return /^[A-Z][a-z-]{2,}$/.test(first) ? first : null;
}

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
    const scientificNames = results.map(
      (item) => item.species.scientificNameWithoutAuthor,
    );

    // 공식 도감은 기획안 기준 30~50종이라 전체를 한 번에 읽어 메모리에서 맞춥니다.
    let officialPlants: PlantRow[] = [];
    if (scientificNames.length) {
      const { data, error } = await supabase
        .from("plants")
        .select("id,korean_name,scientific_name,rarity");

      if (error) throw error;
      officialPlants = data || [];
    }

    const officialByName = new Map(
      officialPlants.map((plant) => [plant.scientific_name, plant]),
    );

    // 속별로 묶어 둡니다. PlantNet이 종명 대신 절 이름('Taraxacum sect. Taraxacum')이나
    // 동의어('Taraxacum campylodes')를 반환할 때 속으로 한 번 더 찾기 위한 것입니다.
    const officialByGenus = new Map<string, PlantRow[]>();
    for (const plant of officialPlants) {
      const genus = genusOf(plant.scientific_name);
      if (!genus) continue;

      const sameGenus = officialByGenus.get(genus);
      if (sameGenus) sameGenus.push(plant);
      else officialByGenus.set(genus, [plant]);
    }

    const candidates = results.map((item) => {
      const scientificName = item.species.scientificNameWithoutAuthor;
      const relatedImage = item.images?.[0];

      let official = officialByName.get(scientificName);
      let matchType: "exact" | "genus" | null = official ? "exact" : null;

      if (!official) {
        const genus = genusOf(scientificName);
        const sameGenus = genus ? officialByGenus.get(genus) : undefined;

        // 같은 속에 공식 식물이 둘 이상이면 어느 쪽인지 정할 수 없으므로 붙이지 않습니다.
        // 임의로 고르면 사용자가 직접 선택한다는 원칙이 깨집니다.
        if (sameGenus?.length === 1) {
          official = sameGenus[0];
          matchType = "genus";
        }
      }

      return {
        plantId: official?.id ?? null,
        official: Boolean(official),
        matchType,
        koreanName:
          official?.korean_name ||
          item.species.commonNames?.[0] ||
          scientificName,
        scientificName,
        scientificNameWithAuthor: item.species.scientificName,
        family: item.species.family?.scientificNameWithoutAuthor || null,
        score: item.score,
        rarity: official?.rarity || null,
        imageUrl:
          relatedImage?.url?.m || relatedImage?.url?.o || relatedImage?.url?.s || null,
        imageAttribution:
          relatedImage?.citation || relatedImage?.author || relatedImage?.license || null,
      };
    });

    const payload: IdentifyResponse = {
      candidates,
      remainingRequests: body.remainingIdentificationRequests ?? null,
    };

    return ok(payload);
  } catch (error) {
    return fail("식물 식별 중 오류가 발생했습니다.", 500, errorMessage(error));
  }
}
