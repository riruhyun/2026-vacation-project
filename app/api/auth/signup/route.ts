import { parseSignupInput, setAuthCookie } from '@/lib/auth-api'
import { createPublicAuthClient } from '@/lib/server/auth'
import { errorMessage, fail, ok } from '@/lib/server/http'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('JSON 본문이 필요합니다.')
  }

  const input = parseSignupInput(body)
  if (!input.success) return fail(input.message)

  try {
    const { data, error } = await createPublicAuthClient().auth.signUp({
      email: input.data.email,
      password: input.data.password,
      options: { data: { nickname: input.data.nickname } },
    })

    if (error || !data.user) {
      const status = error?.status === 429 ? 429 : 400
      return fail(error?.message ?? '회원가입을 완료하지 못했습니다.', status)
    }

    const response = ok(
      {
        user: { id: data.user.id, email: data.user.email ?? input.data.email },
        authenticated: Boolean(data.session),
        emailConfirmationRequired: !data.session,
        accessToken: data.session?.access_token ?? null,
        expiresAt: data.session?.expires_at ?? null,
      },
      201,
    )

    return data.session
      ? setAuthCookie(response, data.session.access_token, data.session.expires_in)
      : response
  } catch (error) {
    return fail('회원가입 처리 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
