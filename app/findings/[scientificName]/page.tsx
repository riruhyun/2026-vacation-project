import { notFound, redirect } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import { ApiError, getCollection } from "@/lib/api";
import { buildFindingDetailData } from "@/lib/api-view-models";
import { getForestPlant } from "@/lib/server/forest";

export const dynamic = "force-dynamic";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ scientificName: string }>;
}) {
  const { scientificName } = await params;
  const decodedName = decodeURIComponent(scientificName);
  try {
    const [collection, forestPlant] = await Promise.all([
      getCollection(),
      // 산림청 조회에 실패해도 화면을 막지 않음
      getForestPlant(decodedName).catch(() => null),
    ]);
    const data = buildFindingDetailData(decodedName, collection, forestPlant);
    if (!data) notFound();

    return <PlantDetailScreen data={data} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
