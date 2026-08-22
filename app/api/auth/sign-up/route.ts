import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { fail } from "@/lib/server/http";
import {
  NICKNAME_TAKEN_MESSAGE,
  nicknameError,
  normalizeNickname,
} from "@/lib/nickname";
import { isNicknameTaken } from "@/lib/server/profile";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown; nickname?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("요청 형식이 올바르지 않습니다.", 400);
  }

  const { email, password, nickname } = body;
  if (typeof email !== "string" || typeof password !== "string") return fail("이메일과 비밀번호를 입력해 주세요.", 400);
  if (typeof nickname !== "string") return fail("닉네임을 입력해 주세요.", 400);

  const normalized = normalizeNickname(nickname);
  const invalidNickname = nicknameError(normalized);
  if (invalidNickname) return fail(invalidNickname, 400);
  if (await isNicknameTaken(normalized)) return fail(NICKNAME_TAKEN_MESSAGE, 409);

  const response = NextResponse.json({ success: true, data: {} });
  const { data, error } = await createAuthServerClient(request, response).auth.signUp({
    email: email.trim(),
    password,
    options: { data: { nickname: normalized } },
  });

  if (error) {
    if (await isNicknameTaken(normalized)) return fail(NICKNAME_TAKEN_MESSAGE, 409);
    return fail(error.message, 400);
  }

  if (!data.session) return fail("Supabase의 Confirm email 설정을 꺼야 합니다.", 409);
  return response;
}
