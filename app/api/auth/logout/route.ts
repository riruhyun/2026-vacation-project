import { clearAuthCookie } from '@/lib/auth-api'
import { createPublicAuthClient } from '@/lib/server/auth'
import { ok } from '@/lib/server/http'
import { accessTokenFrom } from '@/lib/server/user'

export async function POST(request: Request) {
  const token = accessTokenFrom(request)

  if (token) {
    try {
      await createPublicAuthClient().auth.admin.signOut(token, 'local')
    } catch {
      // 만료되었거나 이미 폐기된 세션이어도 로컬 쿠키는 항상 제거합니다.
    }
  }

  return clearAuthCookie(ok({ authenticated: false }))
}
