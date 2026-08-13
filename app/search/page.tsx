import SearchScreen from "@/components/search/SearchScreen";
import { searchPlants } from "@/lib/data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ mode }, plants] = await Promise.all([searchParams, searchPlants("")]);
  return <SearchScreen plants={plants} mode={mode === "identify" ? "identify" : "catalog"} />;
}
