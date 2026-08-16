import { supabase } from './supabase'

/** 닉네임 중복 확인과 프로필 사진 경로처럼 Supabase가 필요한 부분만 모읍니다. */

/** ilike 패턴에서 %와 _가 와일드카드로 해석되지 않게 막습니다. */
function likePattern(value: string) {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`)
}

/**
 * 대소문자를 무시하고 같은 닉네임이 있는지 확인합니다.
 * 최종 방어선은 profiles(lower(nickname)) 고유 인덱스이고, 이 함수는 친절한 메시지용입니다.
 */
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

/** Postgres 고유 제약 위반인지 확인합니다. */
export function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

/** avatars 버킷 안의 저장 경로입니다. 사용자별로 폴더를 나눕니다. */
export function avatarPath(userId: string, extension: string) {
  return `${userId}/${crypto.randomUUID()}.${extension}`
}
