import { getCollectionCards } from '@/lib/server/collection-cards'
import { errorMessage, fail, ok } from '@/lib/server/http'
import {
  AVATAR_BUCKET,
  avatarUrl,
  imageError,
  imageExtension,
} from '@/lib/server/image'
import { levelProgress } from '@/lib/progress'
import {
  NICKNAME_TAKEN_MESSAGE,
  nicknameError,
  normalizeNickname,
} from '@/lib/nickname'
import {
  avatarPath,
  isNicknameTaken,
  isUniqueViolation,
} from '@/lib/server/profile'
import { supabase } from '@/lib/server/supabase'
import { userIdFromSession } from '@/lib/server/user'

type ObservationRow = {
  id: string
  scientific_name: string
  observed_at: string
}

type MatchRow = {
  observation_id: string
  collection_card_id: number | null
}

export async function GET() {
  const userId = await userIdFromSession()
  if (!userId) return fail('로그인이 필요합니다.', 401)

  try {
    const [cards, profileResult, observationResult] = await Promise.all([
      getCollectionCards(),
      supabase
        .from('profiles')
        .select('nickname,xp,level,avatar_path')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('observations')
        .select('id,scientific_name,observed_at')
        .eq('user_id', userId)
        .order('observed_at', { ascending: false }),
    ])

    if (profileResult.error) throw profileResult.error
    if (observationResult.error) throw observationResult.error

    const observations = (observationResult.data || []) as ObservationRow[]
    let matches: MatchRow[] = []
    if (observations.length > 0) {
      const { data, error } = await supabase
        .from('observation_collection_matches')
        .select('observation_id,collection_card_id')
        .in('observation_id', observations.map((item) => item.id))
      if (error) throw error
      matches = (data || []) as MatchRow[]
    }

    const matchByObservation = new Map(
      matches.map((item) => [item.observation_id, item.collection_card_id]),
    )
    const officialCardIds = new Set<number>()
    const otherSpecies = new Set<string>()

    for (const observation of observations) {
      const cardId = matchByObservation.get(observation.id)
      if (cardId != null) officialCardIds.add(cardId)
      else otherSpecies.add(observation.scientific_name.toLowerCase())
    }

    const xp = profileResult.data?.xp || 0
    const progress = levelProgress(xp)

    return ok({
      profile: {
        nickname: profileResult.data?.nickname || null,
        avatarUrl: profileResult.data?.avatar_path
          ? avatarUrl(profileResult.data.avatar_path)
          : null,
        xp,
        level: profileResult.data?.level || progress.level,
        currentLevelXp: progress.currentXp,
        xpToNextLevel: progress.xpToNextLevel,
      },
      stats: {
        totalObservations: observations.length,
        officialPlants: officialCardIds.size,
        otherPlants: otherSpecies.size,
        completionRate: cards.length
          ? Math.round((officialCardIds.size / cards.length) * 100)
          : 0,
        lastObservedAt: observations[0]?.observed_at || null,
      },
    })
  } catch (error) {
    return fail('프로필 통계 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}

// 닉네임과 프로필 사진 수정 - 둘 다 선택 항목이기에 요청을 보낸 것만 반영
// 프로필 사진은 프로필 전용 avatars 버킷에 사용자별 폴더로 저장됨
export async function PATCH(request: Request) {
  const userId = await userIdFromSession()
  if (!userId) return fail('로그인이 필요합니다.', 401)

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('multipart/form-data 형식이 필요합니다.')
  }

  const nicknameField = form.get('nickname')
  const avatarField = form.get('avatar')
  const hasNickname = typeof nicknameField === 'string'
  const hasAvatar = avatarField instanceof File && avatarField.size > 0

  if (!hasNickname && !hasAvatar) return fail('변경할 내용이 없습니다.')

  try {
    const updates: { nickname?: string; avatar_path?: string } = {}

    // 업로드보다 검사를 먼저 끝냄 (중간에 실패해도 파일이 남지 않도록 하기 위함)
    if (hasNickname) {
      const nickname = normalizeNickname(nicknameField)
      const invalid = nicknameError(nickname)
      if (invalid) return fail(invalid)
      if (await isNicknameTaken(nickname, userId)) {
        return fail(NICKNAME_TAKEN_MESSAGE, 409)
      }
      updates.nickname = nickname
    }

    if (hasAvatar) {
      const invalid = imageError(avatarField)
      if (invalid) return fail(invalid)
    }

    const { data: current, error: currentError } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', userId)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) return fail('프로필을 찾을 수 없습니다.', 404)

    const previousAvatarPath = (current as { avatar_path: string | null }).avatar_path

    if (hasAvatar) {
      const path = avatarPath(userId, imageExtension(avatarField))
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, await avatarField.arrayBuffer(), {
          contentType: avatarField.type,
          upsert: false,
        })

      if (uploadError) throw uploadError
      updates.avatar_path = path
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('nickname,avatar_path')
      .single()

    if (error) {
      // 저장 실패시 방금 올린 사진은 삭제
      if (updates.avatar_path) {
        await supabase.storage.from(AVATAR_BUCKET).remove([updates.avatar_path])
      }
      if (isUniqueViolation(error)) return fail(NICKNAME_TAKEN_MESSAGE, 409)
      throw error
    }

    // 새 사진으로 바뀌었으면 이전 파일은 삭제
    if (updates.avatar_path && previousAvatarPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath])
    }

    const updated = data as { nickname: string; avatar_path: string | null }
    return ok({
      profile: {
        nickname: updated.nickname,
        avatarUrl: updated.avatar_path ? avatarUrl(updated.avatar_path) : null,
      },
    })
  } catch (error) {
    return fail('프로필 수정 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
