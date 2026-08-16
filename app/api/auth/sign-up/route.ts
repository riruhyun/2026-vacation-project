import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { fail } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (typeof email !== "string" || typeof password !== "string") return fail("이메일과 비밀번호를 입력해 주세요.", 400);
  const response = NextResponse.json({ success: true, data: {} });
  const { data, error } = await createAuthServerClient(request, response).auth.signUp({ email: email.trim(), password });
  if (error) return fail(error.message, 400);
  if (!data.session) return fail("Supabase의 Confirm email 설정을 꺼야 합니다.", 409);
  return response;
}
