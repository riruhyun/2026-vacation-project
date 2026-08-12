import { notFound } from "next/navigation";
import PlantDetailScreen from "@/components/plants/PlantDetailScreen";
import {
  getMockCollectedPlantBySpeciesId,
  getMockPlantSpeciesById,
} from "@/data/mock-plants";

interface PlantDetailPageProps {
  params: Promise<{ id: string }>;
}

const DETAIL_IMAGES = [
  "/plants/example1.jpg",
  "/plants/example2.webp",
  "/plants/example3.jpg",
];

export default async function PlantDetailPage({ params }: PlantDetailPageProps) {
  const { id } = await params;
  const species = getMockPlantSpeciesById(id);
  const collected = getMockCollectedPlantBySpeciesId(id);

  if (!species) {
    notFound();
  }

  const formattedDate = collected ? formatDate(collected.firstFoundAt) : null;
  const imageUrl = DETAIL_IMAGES[Math.abs(hashString(species.slug)) % DETAIL_IMAGES.length];

  return (
    <PlantDetailScreen
      species={species}
      collected={collected}
      formattedDate={formattedDate}
      imageUrl={imageUrl}
    />
  );
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}