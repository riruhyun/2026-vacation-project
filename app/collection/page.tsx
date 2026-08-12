import CollectionEmptyState from "@/components/collection/CollectionEmptyState";
import CollectionScreen from "@/components/collection/CollectionScreen";
import { mockCollectedPlants } from "@/data/mock-plants";

export default function CollectionPage() {
  if (mockCollectedPlants.length === 0) {
    return <CollectionEmptyState />;
  }

  return <CollectionScreen />;
}