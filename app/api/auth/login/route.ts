import { parseLoginInput, setAuthCookie } from '@/lib/auth-api'
import { authErrorStatus, createPublicAuthClient } from '@/lib/server/auth'
import { errorMessage, fail, ok } from '@/lib/server/http'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('JSON 본문이 필요합니다.')
  }

  const input = parseLoginInput(body)
  if (!input.success) return fail(input.message)

  try {
    const { data, error } = await createPublicAuthClient().auth.signInWithPassword(
      input.data,
    )

    if (error || !data.user || !data.session) {
      return fail(
        error?.code === 'email_not_confirmed'
          ? '이메일 확인이 필요합니다.'
          : '이메일 또는 비밀번호가 올바르지 않습니다.',
        error ? authErrorStatus(error) : 401,
      )
    }

    return setAuthCookie(
      ok({
        user: { id: data.user.id, email: data.user.email ?? input.data.email },
        authenticated: true,
        emailConfirmationRequired: false,
        accessToken: data.session.access_token,
        expiresAt: data.session.expires_at ?? null,
      }),
      data.session.access_token,
      data.session.expires_in,
    )
  } catch (error) {
    return fail('로그인 처리 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
