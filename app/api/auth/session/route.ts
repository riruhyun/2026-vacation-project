import { emailToLocalId, isLocalIdEmail } from '@/lib/auth-api'
import { ok } from '@/lib/server/http'
import { supabase } from '@/lib/server/supabase'
import { accessTokenFrom } from '@/lib/server/user'

/**
 * 지금 로그인한 사람이 누구인지 알려줍니다. 아무도 없으면 그것도 정상 응답입니다.
 *
 * 보호된 자원이 아니라 질문이므로 401을 내지 않습니다. 401을 내면 화면은
 * "로그인 안 한 상태"와 "서버가 고장난 상태"를 구분할 수 없고, 첫 화면을
 * 그릴 때마다 콘솔에 에러가 쌓입니다. 그래서 둘 다 200으로 답합니다.
 */
export async function GET(request: Request) {
  const token = accessTokenFrom(request)
  if (!token) return ok({ authenticated: false, user: null })

  const { data, error } = await supabase.auth.getUser(token)

  // 만료되었거나 폐기된 토큰은 없는 것과 같게 다룹니다.
  if (error || !data.user) return ok({ authenticated: false, user: null })

  const account = data.user.email ?? ''

  return ok({
    authenticated: true,
    user: {
      id: data.user.id,
      account: emailToLocalId(account),
      isLocalId: isLocalIdEmail(account),
    },
  })
}
