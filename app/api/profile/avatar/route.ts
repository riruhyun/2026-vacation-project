import { errorMessage, fail, ok } from '@/lib/server/http'
import { AVATAR_BUCKET } from '@/lib/server/image'
import { supabase } from '@/lib/server/supabase'
import { userIdFromSession } from '@/lib/server/user'

/**
 * 프로필 사진을 지우고 기본 사진으로 되돌립니다.
 *
 * 사진만 지우는 요청이라 계정 삭제로 읽히지 않게 /api/profile 아래에 두었습니다.
 * 이미 기본 사진이어도 성공으로 답합니다. 두 번 눌러도 결과가 같아야 하기 때문입니다.
 */
export async function DELETE() {
  const userId = await userIdFromSession()
  if (!userId) return fail('로그인이 필요합니다.', 401)

  try {
    const { data: current, error: currentError } = await supabase
      .from('profiles')
      .select('nickname,avatar_path')
      .eq('id', userId)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) return fail('프로필을 찾을 수 없습니다.', 404)

    const { nickname, avatar_path: previousAvatarPath } = current as {
      nickname: string
      avatar_path: string | null
    }

    if (!previousAvatarPath) {
      return ok({ profile: { nickname, avatarUrl: null } })
    }

    // 열을 먼저 비웁니다. 파일 삭제가 실패해도 화면은 기본 사진으로 맞습니다.
    // 순서를 뒤집으면 저장에 실패했을 때 없는 파일을 가리키게 됩니다.
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_path: null, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw error

    await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath])

    return ok({ profile: { nickname, avatarUrl: null } })
  } catch (error) {
    return fail('프로필 사진 삭제 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
