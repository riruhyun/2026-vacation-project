import { getCollectionCards } from '@/lib/server/collection-cards'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { levelProgress } from '@/lib/progress'
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
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    const [cards, profileResult, observationResult] = await Promise.all([
      getCollectionCards(),
      supabase
        .from('profiles')
        .select('nickname,xp,level')
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
