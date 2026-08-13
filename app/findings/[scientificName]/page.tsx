import { notFound } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import { getFindingDetail } from "@/lib/data";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ scientificName: string }>;
}) {
  const { scientificName } = await params;
  const data = await getFindingDetail(decodeURIComponent(scientificName));
  if (!data) notFound();

  return <PlantDetailScreen data={data} />;
}
