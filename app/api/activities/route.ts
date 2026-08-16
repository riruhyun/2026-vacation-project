import { parseActivityLimit, toActivityDto, type ActivityRow } from "@/lib/activities";
import { errorMessage, fail, ok } from "@/lib/server/http";
import { supabase } from "@/lib/server/supabase";
import { userIdFromSession } from "@/lib/server/user";

export async function GET(request: Request) {
  const userId = await userIdFromSession();
  if (!userId) return fail("로그인이 필요합니다.", 401);

  try {
    const limit = parseActivityLimit(new URL(request.url).searchParams.get("limit"));
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id,type,collection_card_id,scientific_name,display_name,level,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ok({ activities: ((data || []) as ActivityRow[]).map(toActivityDto) });
  } catch (error) {
    return fail("활동 기록을 불러오지 못했습니다.", 500, errorMessage(error));
  }
}
