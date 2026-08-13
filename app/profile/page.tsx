import ProfileScreen from "@/components/profile/ProfileScreen";
import { getProfileData } from "@/lib/data";

export default async function ProfilePage() {
  const data = await getProfileData();
  return <ProfileScreen data={data} />;
}
