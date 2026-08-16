import { NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/supabase/auth-server";
import { fail } from "@/lib/server/http";
import {
  NICKNAME_TAKEN_MESSAGE,
  nicknameError,
  normalizeNickname,
} from "@/lib/nickname";
import { isNicknameTaken } from "@/lib/server/profile";

/**
 * 닉네임, 이메일, 비밀번호를 한 번에 받습니다.
 * 닉네임은 auth.users의 메타데이터로 넘기고, handle_new_user 트리거가 profiles에 씁니다.
 */
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
    // 위 확인과 계정 생성 사이에 누가 같은 닉네임을 선점하면 고유 인덱스가 막습니다.
    // 그때 Supabase는 원인을 감춘 메시지를 주므로 다시 확인해 이유를 알려줍니다.
    if (await isNicknameTaken(normalized)) return fail(NICKNAME_TAKEN_MESSAGE, 409);
    return fail(error.message, 400);
  }

  if (!data.session) return fail("Supabase의 Confirm email 설정을 꺼야 합니다.", 409);
  return response;
}
