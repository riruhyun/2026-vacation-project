import { notFound, redirect } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import { ApiError, getCollection } from "@/lib/api";
import { buildFindingDetailData } from "@/lib/api-view-models";

export const dynamic = "force-dynamic";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ scientificName: string }>;
}) {
  const { scientificName } = await params;
  try {
    const collection = await getCollection();
    const data = buildFindingDetailData(decodeURIComponent(scientificName), collection);
    if (!data) notFound();

    return <PlantDetailScreen data={data} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
