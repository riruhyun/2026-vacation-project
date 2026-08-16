import { createServerClient } from "@/lib/supabase/server";

export async function userIdFromSession(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;
  return error || typeof subject !== "string" ? null : subject;
}
