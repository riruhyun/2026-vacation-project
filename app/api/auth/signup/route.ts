import { AUTH_MESSAGES } from '@/lib/auth-api'
import { fail } from '@/lib/server/http'

/**
 * 이메일 회원가입은 받지 않습니다. 가입 입구는 구글 하나입니다.
 *
 * 이메일과 비밀번호만으로 계정을 만들 수 있으면 메일함 주인임을 증명하지 않고도
 * 남의 주소를 선점할 수 있습니다. Supabase는 이메일이 같은 계정을 자동으로 합치므로,
 * 주인이 나중에 구글로 들어오는 순간 선점한 사람이 그 계정에 함께 들어가게 됩니다.
 *
 * 구글은 이 증명을 구글이 대신 해주기 때문에 같은 문제가 없습니다.
 * 이메일/비밀번호가 필요하면 구글로 로그인한 뒤 POST /api/auth/password로 추가합니다.
 *
 * 라우트를 지우지 않고 남겨두는 것은, 예전 클라이언트가 404 대신 이유를 받도록 하기 위해서입니다.
 */
export async function POST() {
  return fail(AUTH_MESSAGES.signupClosed, 403, { reason: 'signup_closed' })
}
