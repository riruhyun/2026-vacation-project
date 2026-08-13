import { notFound } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import { getPlantDetail } from "@/lib/data";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const data = await getPlantDetail(numericId);
  if (!data) notFound();

  return <PlantDetailScreen data={data} />;
}
