import { redirect } from "next/navigation";
import CollectionScreen from "@/components/collection/CollectionScreen";
import { ApiError, getCollection } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  try {
    const data = await getCollection();
    return <CollectionScreen data={data} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
