import { AUTH_COOKIE } from '@/lib/auth-cookie'
import { supabase } from './supabase'

/** Supabase 액세스 토큰 하나로 사용자를 확인합니다. 토큰이 유효하지 않으면 null입니다. */
export async function userIdFromToken(token: string | null | undefined) {
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  return error || !data.user ? null : data.user.id
}

function cookieToken(request: Request) {
  const header = request.headers.get('cookie')
  if (!header) return null

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === AUTH_COOKIE) return decodeURIComponent(rest.join('='))
  }

  return null
}

/**
 * 라우트 핸들러를 호출한 사용자를 확인합니다.
 * Authorization 헤더의 Bearer 토큰을 먼저 보고, 없으면 세션 쿠키를 봅니다.
 * 구글 로그인으로 발급된 토큰만 신뢰하며 개발용 우회 경로는 없습니다.
 */
export async function userIdFrom(request: Request) {
  const authorization = request.headers.get('authorization')
  const bearer = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : null

  return (await userIdFromToken(bearer)) ?? (await userIdFromToken(cookieToken(request)))
}
