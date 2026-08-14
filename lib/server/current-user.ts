import "server-only";

import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth-cookie";
import { userIdFromToken } from "@/lib/server/user";

/**
 * 서버 컴포넌트에서 현재 로그인한 사용자를 확인합니다.
 * 로그인하지 않았으면 null이며, 개발용 대체 사용자는 없습니다.
 */
export async function currentUserId() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return userIdFromToken(token ? decodeURIComponent(token) : null);
}
