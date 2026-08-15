import { AUTH_MESSAGES, parseSignupInput, setAuthCookie } from '@/lib/auth-api'
import { lookupAccount, markSitePassword } from '@/lib/server/account'
import { createPublicAuthClient } from '@/lib/server/auth'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { supabase } from '@/lib/server/supabase'

/**
 * 아이디와 비밀번호로 가입합니다. 이메일 주소는 받지 않습니다.
 *
 * 아이디는 .invalid 도메인을 붙여 저장하므로 실제 메일 주소와 절대 같아질 수 없습니다.
 * Supabase는 이메일이 같은 계정만 합치기 때문에, 남의 지메일 주소를 미리 차지해 두었다가
 * 주인이 구글로 들어올 때 함께 들어가는 선점 공격이 구조적으로 불가능합니다.
 *
 * 계정은 admin API로 만들고 email_confirm을 켭니다. 보낼 수 없는 주소이므로
 * 확인 메일을 시도조차 하지 않아야 하고, 인증 번호를 받을 일도 없습니다.
 */
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
    if ((await lookupAccount(input.data.email)).exists) {
      return fail(AUTH_MESSAGES.idTaken, 409, { reason: 'id_taken' })
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: input.data.email,
      password: input.data.password,
      email_confirm: true,
      user_metadata: { nickname: input.data.nickname },
    })

    if (createError || !created.user) {
      return fail(createError?.message ?? '회원가입을 완료하지 못했습니다.', 400)
    }

    // 아이디 계정은 처음부터 비밀번호로 들어옵니다. 로그인 실패를 구분할 때 쓰는 값입니다.
    await markSitePassword(created.user.id)

    // 가입 직후 바로 로그인시킵니다. 확인 메일 단계가 없으므로 기다릴 것이 없습니다.
    const { data: session, error: signInError } = await createPublicAuthClient()
      .auth.signInWithPassword({
        email: input.data.email,
        password: input.data.password,
      })

    const response = ok(
      {
        user: { id: created.user.id, account: input.data.id, isLocalId: true },
        authenticated: Boolean(session?.session),
        accessToken: session?.session?.access_token ?? null,
        expiresAt: session?.session?.expires_at ?? null,
      },
      201,
    )

    if (signInError || !session?.session) return response

    return setAuthCookie(
      response,
      session.session.access_token,
      session.session.expires_in,
    )
  } catch (error) {
    return fail('회원가입 처리 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
