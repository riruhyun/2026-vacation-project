import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { fail, ok } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (typeof email !== "string" || typeof password !== "string") return fail("이메일과 비밀번호를 입력해 주세요.", 400);
  const response = NextResponse.json({ success: true, data: {} });
  const { error } = await createAuthServerClient(request, response).auth.signInWithPassword({ email: email.trim(), password });
  if (error) return fail(error.message, 400);
  return response;
}
