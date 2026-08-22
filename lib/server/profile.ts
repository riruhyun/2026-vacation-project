import { supabase } from './supabase'

// 닉네임 중복 확인과 프로필 사진 경로처럼 Supabase가 필요한 부분만 모음

// ilike 패턴에서 %와 _가 와일드카드로 해석되지 않게 막음
function likePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

export async function isNicknameTaken(nickname: string, exceptUserId?: string) {
  let query = supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('nickname', likePattern(nickname))

  if (exceptUserId) query = query.neq('id', exceptUserId)

  const { count, error } = await query
  if (error) throw error
  return (count || 0) > 0
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

// avatars 버킷 안의 저장 경로 - 사용자별로 폴더를 나눔
export function avatarPath(userId: string, extension: string) {
  return `${userId}/${crypto.randomUUID()}.${extension}`
}
