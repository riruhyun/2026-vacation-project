import { redirect } from "next/navigation";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { ApiError, getCollection, getProfile } from "@/lib/api";
import { buildProfilePageData } from "@/lib/api-view-models";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  try {
    const [collection, profile] = await Promise.all([getCollection(), getProfile()]);
    return <ProfileScreen data={buildProfilePageData(profile, collection)} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
