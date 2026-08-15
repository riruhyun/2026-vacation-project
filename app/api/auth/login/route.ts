import {
  AUTH_MESSAGES,
  type AuthFailureReason,
  emailToLocalId,
  isLocalIdEmail,
  parseLoginInput,
  setAuthCookie,
} from '@/lib/auth-api'
import { lookupAccount } from '@/lib/server/account'
import { createPublicAuthClient } from '@/lib/server/auth'
import { errorMessage, fail, ok } from '@/lib/server/http'

/** 화면이 문구 대신 이 값으로 분기하도록 reason을 함께 내려보냅니다. */
function refuse(message: string, reason: AuthFailureReason, status: number) {
  return fail(message, status, { reason })
}

/**
 * 로그인이 실패한 이유를 계정 상태로 구분합니다.
 *
 * 가입 입구는 구글 하나이므로, 비밀번호가 틀린 것과
 * "애초에 비밀번호를 만든 적이 없는 것"은 사용자에게 전혀 다른 상황입니다.
 * 후자에게 "비밀번호가 올바르지 않습니다"를 보여주면 영영 들어올 수 없습니다.
 */
async function explainFailure(email: string, byLocalId: boolean) {
  const account = await lookupAccount(email)

  if (!account.exists) {
    return byLocalId
      ? refuse(AUTH_MESSAGES.notRegistered, 'not_registered', 401)
      : refuse(AUTH_MESSAGES.notRegisteredEmail, 'not_registered', 401)
  }

  // 아이디 계정은 처음부터 비밀번호가 있으므로 구글 안내를 띄우면 안 됩니다.
  if (account.isLocalId) {
    return refuse(AUTH_MESSAGES.invalidPassword, 'invalid_password', 401)
  }

  if (!account.hasSitePassword) {
    // 구글로만 가입한 계정입니다. 사이트 전용 비밀번호를 먼저 만들어야 합니다.
    // 그 설정은 구글로 로그인한 뒤에만 가능합니다(POST /api/auth/password).
    return refuse(AUTH_MESSAGES.googleOnly, 'google_only', 409)
  }

  return refuse(AUTH_MESSAGES.invalidPassword, 'invalid_password', 401)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('JSON 본문이 필요합니다.')
  }

  const input = parseLoginInput(body)
  if (!input.success) return fail(input.message)

  const { email, password, byLocalId } = input.data

  try {
    const { data, error } = await createPublicAuthClient().auth.signInWithPassword({
      email,
      password,
    })

    if (error?.code === 'email_not_confirmed') {
      return refuse(AUTH_MESSAGES.emailNotConfirmed, 'email_not_confirmed', 403)
    }

    // 요청이 몰려 막힌 것은 계정 상태와 무관하므로 그대로 알려줍니다.
    if (error?.status === 429) {
      return fail('요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', 429)
    }

    if (error || !data.user || !data.session) {
      return explainFailure(email, byLocalId)
    }

    // 아이디 계정은 저장된 .invalid 주소 대신 사용자가 입력한 아이디를 돌려줍니다.
    const account = data.user.email ?? email

    return setAuthCookie(
      ok({
        user: {
          id: data.user.id,
          account: emailToLocalId(account),
          isLocalId: isLocalIdEmail(account),
        },
        authenticated: true,
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
