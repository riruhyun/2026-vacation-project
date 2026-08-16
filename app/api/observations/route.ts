import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageError, imageExtension, imageUrl } from '@/lib/server/image'
import { toObservationDto } from '@/lib/server/observation'
import { getCollectionCardById } from '@/lib/server/collection-cards'
import {
  levelProgress,
  observationXpEvents,
  sumXp,
  xpDayStartIso,
} from '@/lib/progress'
import { supabase } from '@/lib/server/supabase'
import { userIdFromSession } from '@/lib/server/user'

export const runtime = 'nodejs'

type RewardRow = {
  observation_id: string
  observed_at: string
  collection_count: number
  xp_awarded: number
  total_xp: number
  user_level: number
  collection_display_name: string
}

function text(form: FormData, key: string) {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** 같은 날(한국 시간) 같은 종을 이미 기록했는지 확인합니다. */
async function isSameDayRepeat(
  userId: string,
  collectionCardId: number | null,
  scientificName: string,
) {
  const { data, error } = await supabase
    .from('observations')
    .select('id,scientific_name')
    .eq('user_id', userId)
    .gte('observed_at', xpDayStartIso())

  if (error) throw error

  const todayObservations = (data || []) as Array<{
    id: string
    scientific_name: string
  }>
  if (todayObservations.length === 0) return false

  if (collectionCardId === null) {
    const target = scientificName.toLowerCase()
    return todayObservations.some(
      (item) => item.scientific_name.toLowerCase() === target,
    )
  }

  const { data: matches, error: matchError } = await supabase
    .from('observation_collection_matches')
    .select('observation_id')
    .eq('collection_card_id', collectionCardId)
    .in(
      'observation_id',
      todayObservations.map((item) => item.id),
    )

  if (matchError) throw matchError
  return (matches || []).length > 0
}

/** 이 종을 처음 기록하는 관찰인지 확인합니다. */
async function isFirstDiscovery(
  userId: string,
  collectionCardId: number | null,
  scientificName: string,
) {
  if (collectionCardId === null) {
    const { count, error } = await supabase
      .from('observations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('scientific_name', scientificName)

    if (error) throw error
    return (count || 0) === 0
  }

  const { data, error } = await supabase
    .from('user_collection_counts')
    .select('count')
    .eq('user_id', userId)
    .eq('collection_card_id', collectionCardId)
    .maybeSingle()

  if (error) throw error
  return ((data as { count: number } | null)?.count || 0) === 0
}

export async function POST(request: Request) {
  const userId = await userIdFromSession()
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return fail('multipart/form-data 형식이 필요합니다.')
    }

    const image = form.get('image')

    if (!(image instanceof File)) return fail('image 파일이 필요합니다.')

    const validationError = imageError(image)
    if (validationError) return fail(validationError)

    const plantIdText = text(form, 'plantId')
    const plantId = plantIdText ? Number(plantIdText) : null

    if (plantId !== null && (!Number.isInteger(plantId) || plantId < 1)) {
      return fail('plantId가 올바르지 않습니다.')
    }

    const submittedScientificName = text(form, 'scientificName')
    const genusName = text(form, 'genusName') || null
    const displayName = text(form, 'displayName')
    const scoreText = text(form, 'identificationScore')
    const identificationScore = scoreText ? Number(scoreText) : null

    if (!submittedScientificName) {
      return fail('scientificName이 필요합니다.')
    }

    if (
      identificationScore !== null &&
      (!Number.isFinite(identificationScore) ||
        identificationScore < 0 ||
        identificationScore > 1)
    ) {
      return fail('identificationScore가 올바르지 않습니다.')
    }

    let candidates: unknown[] = []
    const candidatesText = text(form, 'identificationCandidates')
    if (candidatesText) {
      try {
        const parsed = JSON.parse(candidatesText) as unknown
        if (!Array.isArray(parsed)) throw new Error('not an array')
        candidates = parsed
      } catch {
        return fail('identificationCandidates가 올바르지 않습니다.')
      }
    }

    const collectionCard =
      plantId !== null ? await getCollectionCardById(plantId) : null

    if (plantId !== null && !collectionCard) {
      return fail('공식 식물을 찾을 수 없습니다.', 404)
    }

    if (!collectionCard && !displayName) {
      return fail('기타 식물은 displayName이 필요합니다.')
    }

    // XP는 서버에서만 계산하고, Supabase 함수에는 확정된 값만 넘깁니다.
    const [sameDayRepeat, firstDiscovery] = await Promise.all([
      isSameDayRepeat(
        userId,
        collectionCard?.id ?? null,
        submittedScientificName,
      ),
      isFirstDiscovery(
        userId,
        collectionCard?.id ?? null,
        submittedScientificName,
      ),
    ])

    const xpBreakdown = observationXpEvents({
      rarity: collectionCard?.rarity ?? null,
      firstDiscovery,
      sameDayRepeat,
    })
    const xpAwarded = sumXp(xpBreakdown)

    const path = `${userId}/${crypto.randomUUID()}.${imageExtension(image)}`
    const { error: uploadError } = await supabase.storage
      .from('observations')
      .upload(path, await image.arrayBuffer(), {
        contentType: image.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase.rpc(
      'record_collection_observation_reward',
      {
        p_user_id: userId,
        p_collection_card_id: collectionCard?.id ?? null,
        p_identified_scientific_name: submittedScientificName,
        p_identified_genus_name: genusName,
        p_display_name: displayName,
        p_image_path: path,
        p_identification_score: identificationScore,
        p_candidates: candidates,
        // 함수는 이 값을 가공하지 않고 그대로 적립합니다.
        p_base_xp: xpAwarded,
      },
    )

    if (insertError) {
      await supabase.storage.from('observations').remove([path])
      throw insertError
    }

    const reward = (data as RewardRow[] | null)?.[0]
    if (!reward) {
      await supabase.storage.from('observations').remove([path])
      throw new Error('관찰 보상 결과가 없습니다.')
    }

    const progress = levelProgress(reward.total_xp)
    const previousLevel = levelProgress(
      reward.total_xp - reward.xp_awarded,
    ).level
    const observation = {
      id: reward.observation_id,
      scientific_name: submittedScientificName,
      display_name: reward.collection_display_name,
      image_path: path,
      observed_at: reward.observed_at,
    }

    return ok(
      {
        result: reward.collection_count === 1 ? 'new' : 'duplicate',
        observation: toObservationDto(
          observation,
          imageUrl(observation.image_path),
          collectionCard?.id ?? null,
        ),
        reward: {
          xp: reward.xp_awarded,
          breakdown: xpBreakdown,
          totalXp: reward.total_xp,
          level: reward.user_level,
          currentLevelXp: progress.currentXp,
          xpToNextLevel: progress.xpToNextLevel,
          leveledUp: reward.user_level > previousLevel,
          plantCount: reward.collection_count,
        },
      },
      201,
    )
  } catch (error) {
    return fail('관찰 기록 저장 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
