import { notFound } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import { ApiError, getPlant } from "@/lib/api";
import { buildPlantDetailData } from "@/lib/api-view-models";

export const dynamic = "force-dynamic";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  try {
    const data = buildPlantDetailData(await getPlant(numericId));
    return <PlantDetailScreen data={data} />;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400 || error.status === 404) {
        notFound();
      }
    }

    throw error;
  }
}
