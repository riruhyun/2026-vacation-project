import { redirect } from "next/navigation";
import HomeScreen from "@/components/home/HomeScreen";
import { ApiError, getCollection, getProfile } from "@/lib/api";
import { buildHomeData } from "@/lib/api-view-models";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const [collection, profile] = await Promise.all([getCollection(), getProfile()]);
    return <HomeScreen data={buildHomeData(profile, collection)} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
