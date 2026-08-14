import { getCollectionCards } from '@/lib/server/collection-cards'
import { errorMessage, fail, ok } from '@/lib/server/http'
import {
  collectedCardIds,
  FEATURED_PLANT_SLOTS,
  getFeaturedPlants,
  getProfileRow,
  NICKNAME_MAX_LENGTH,
} from '@/lib/server/profile'
import { levelProgress, levelTitle } from '@/lib/progress'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

type ObservationRow = {
  id: string
  scientific_name: string
  observed_at: string
}

type MatchRow = {
  observation_id: string
  collection_card_id: number | null
}

type ActivityRow = {
  id: string
  type: 'new_plant' | 'level_up'
  scientific_name: string | null
  display_name: string | null
  level: number | null
  created_at: string
}

async function profilePayload(userId: string) {
  const [cards, profileRow, observationResult, activityResult] = await Promise.all([
    getCollectionCards(),
    getProfileRow(userId),
    supabase
      .from('observations')
      .select('id,scientific_name,observed_at')
      .eq('user_id', userId)
      .order('observed_at', { ascending: false }),
    supabase
      .from('activity_logs')
      .select('id,type,scientific_name,display_name,level,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (observationResult.error) throw observationResult.error
  if (activityResult.error && activityResult.error.code !== 'PGRST205') {
    throw activityResult.error
  }

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

  const xp = profileRow?.xp || 0
  const progress = levelProgress(xp)
  const featuredPlants = await getFeaturedPlants(userId, profileRow?.featured_card_ids)

  return {
    profile: {
      nickname: profileRow?.nickname || null,
      xp,
      level: profileRow?.level || progress.level,
      currentLevelXp: progress.currentXp,
      xpToNextLevel: progress.xpToNextLevel,
      onboarded: Boolean(profileRow?.onboarded_at),
    },
    featuredPlants,
    stats: {
      totalObservations: observations.length,
      officialPlants: officialCardIds.size,
      totalOfficialPlants: cards.length,
      otherPlants: otherSpecies.size,
      completionRate: cards.length
        ? Math.round((officialCardIds.size / cards.length) * 100)
        : 0,
      lastObservedAt: observations[0]?.observed_at || null,
    },
    recentActivities: ((activityResult.data || []) as ActivityRow[]).map(
      (activity) => ({
        id: activity.id,
        type: activity.type,
        scientificName: activity.scientific_name,
        displayName: activity.display_name,
        level: activity.level,
        levelTitle: activity.level ? levelTitle(activity.level) : null,
        createdAt: activity.created_at,
      }),
    ),
  }
}

export async function GET(request: Request) {
  const userId = await userIdFrom(request)
  if (!userId) return fail('로그인이 필요합니다.', 401)

  try {
    return ok(await profilePayload(userId))
  } catch (error) {
    return fail('프로필 통계 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}

/** 닉네임과 대표 식물을 저장합니다. 보낸 항목만 바뀝니다. */
export async function PATCH(request: Request) {
  const userId = await userIdFrom(request)
  if (!userId) return fail('로그인이 필요합니다.', 401)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('JSON 본문이 필요합니다.')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return fail('JSON 객체가 필요합니다.')
  }

  const input = body as { nickname?: unknown; featuredPlantIds?: unknown }
  const update: Record<string, unknown> = {}

  if (input.nickname !== undefined) {
    if (typeof input.nickname !== 'string') {
      return fail('nickname은 문자열이어야 합니다.')
    }

    const nickname = input.nickname.trim()
    if (nickname.length < 1 || nickname.length > NICKNAME_MAX_LENGTH) {
      return fail(`닉네임은 1자 이상 ${NICKNAME_MAX_LENGTH}자 이하여야 합니다.`)
    }

    update.nickname = nickname
  }

  if (input.featuredPlantIds !== undefined) {
    if (!Array.isArray(input.featuredPlantIds)) {
      return fail('featuredPlantIds는 배열이어야 합니다.')
    }

    if (input.featuredPlantIds.length > FEATURED_PLANT_SLOTS) {
      return fail(`대표 식물은 최대 ${FEATURED_PLANT_SLOTS}개까지 고를 수 있습니다.`)
    }

    const ids = input.featuredPlantIds.map(Number)
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
      return fail('featuredPlantIds에는 식물 id만 담을 수 있습니다.')
    }

    if (new Set(ids).size !== ids.length) {
      return fail('같은 식물을 두 번 고를 수 없습니다.')
    }

    try {
      const collected = await collectedCardIds(userId)
      const notCollected = ids.filter((id) => !collected.has(id))
      if (notCollected.length > 0) {
        return fail(
          `아직 수집하지 않은 식물은 대표로 걸 수 없습니다. (id: ${notCollected.join(', ')})`,
        )
      }
    } catch (error) {
      return fail('대표 식물 확인 중 오류가 발생했습니다.', 500, errorMessage(error))
    }

    update.featured_card_ids = ids
  }

  if (Object.keys(update).length === 0) {
    return fail('바꿀 값이 없습니다.')
  }

  try {
    // 한 번이라도 저장하면 온보딩을 마친 것으로 봅니다.
    const now = new Date().toISOString()
    update.onboarded_at = now
    update.updated_at = now

    const { error } = await supabase.from('profiles').update(update).eq('id', userId)
    if (error) throw error

    return ok(await profilePayload(userId))
  } catch (error) {
    return fail('프로필 저장 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
