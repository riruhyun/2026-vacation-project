const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// 로그인 연결 전까지는 x-user-id 헤더로 사용자를 구분합니다.
// Supabase Auth가 붙으면 이 파일만 세션 기반으로 교체하면 됩니다.
export function userIdFrom(request: Request) {
  const userId = request.headers.get('x-user-id') || process.env.DEV_USER_ID
  return userId && uuidPattern.test(userId) ? userId : null
}
