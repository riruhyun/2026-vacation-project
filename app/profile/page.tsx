import { redirect } from "next/navigation";
import ProfileScreen from "@/components/profile/ProfileScreen";
import { ApiError, getActivities, getProfile } from "@/lib/api";
import { buildProfilePageData } from "@/lib/api-view-models";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  try {
    const [activities, profile] = await Promise.all([getActivities(), getProfile()]);
    return <ProfileScreen data={buildProfilePageData(profile, activities)} />;
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      redirect("/login");
    }

    throw error;
  }
}
