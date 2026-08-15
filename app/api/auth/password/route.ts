import { parsePasswordInput } from '@/lib/auth-api'
import { markSitePassword } from '@/lib/server/account'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

/**
 * 사이트 전용 비밀번호를 설정합니다.
 *
 * 로그인한 상태에서만 부를 수 있는 것이 핵심입니다.
 * 로그인 전에 만들 수 있게 하면 남의 이메일 주소로 비밀번호를 선점한 뒤
 * 주인이 구글로 들어올 때 같은 계정으로 합쳐져 계정을 빼앗을 수 있습니다.
 * "이미 본인임이 증명된 사람만 열쇠를 추가한다" — 이 규칙이 안전성을 지탱합니다.
 */
export async function POST(request: Request) {
  const userId = await userIdFrom(request)
  if (!userId) return fail('로그인이 필요합니다.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('JSON 본문이 필요합니다.')
  }

  const input = parsePasswordInput(body)
  if (!input.success) return fail(input.message)

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: input.data.password,
    })

    if (error) {
      return fail(error.message || '비밀번호를 설정하지 못했습니다.', 400)
    }

    if (!(await markSitePassword(userId))) {
      return fail('비밀번호는 바뀌었지만 설정 상태를 저장하지 못했습니다.', 500)
    }

    return ok({ hasSitePassword: true })
  } catch (error) {
    return fail('비밀번호 설정 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
