import CollectionScreen from "@/components/collection/CollectionScreen";
import { getCollectionData } from "@/lib/data";

export default async function CollectionPage() {
  const data = await getCollectionData();
  return <CollectionScreen data={data} />;
}
