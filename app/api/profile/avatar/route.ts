import { errorMessage, fail, ok } from '@/lib/server/http'
import { AVATAR_BUCKET } from '@/lib/server/image'
import { supabase } from '@/lib/server/supabase'
import { userIdFromSession } from '@/lib/server/user'

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

    // 열을 먼저 비움
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
