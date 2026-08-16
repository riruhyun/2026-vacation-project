import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageError, imageExtension, imageUrl } from '@/lib/server/image'
import { toObservationDto } from '@/lib/server/observation'
import { getCollectionCardById } from '@/lib/server/collection-cards'
import { levelProgress, observationXp, toBaseXp } from '@/lib/progress'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

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

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 한국 시간으로 오늘 0시가 되는 순간을 돌려줍니다.
 *
 * observed_at은 UTC로 저장되므로 그대로 날짜를 자르면 오전 9시 이전이
 * 전날로 취급됩니다. 사용자가 보는 "오늘"과 어긋나지 않게 맞춥니다.
 */
function startOfKoreanDay(now = new Date()) {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  const midnight = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate(),
  )
  return new Date(midnight - KST_OFFSET_MS)
}

/** 이 카드를 몇 번 모았는지 봅니다. 0이면 이번이 첫 발견입니다. */
async function previousCardCount(userId: string, cardId: number) {
  const { data } = await supabase
    .from('user_collection_counts')
    .select('count')
    .eq('user_id', userId)
    .eq('collection_card_id', cardId)
    .maybeSingle()

  return data?.count ?? 0
}

/** 오늘 이미 이 카드를 찍었는지 봅니다. 찍었다면 같은 발견이므로 보상이 없습니다. */
async function observedCardToday(userId: string, cardId: number) {
  const { count } = await supabase
    .from('observations')
    .select('id, observation_collection_matches!inner(collection_card_id)', {
      count: 'exact',
      head: true,
    })
    .eq('user_id', userId)
    .eq('observation_collection_matches.collection_card_id', cardId)
    .gte('observed_at', startOfKoreanDay().toISOString())

  return (count ?? 0) > 0
}


export async function POST(request: Request) {
  const userId = await userIdFrom(request)
  if (!userId) return fail('로그인이 필요합니다.', 401)

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

    // 경험치는 저장 전에 정합니다. 사진 업로드가 실패하면 지급도 없어야 합니다.
    const [previousCount, observedToday] = collectionCard
      ? await Promise.all([
          previousCardCount(userId, collectionCard.id),
          observedCardToday(userId, collectionCard.id),
        ])
      : [0, false]

    const earned = observationXp(
      collectionCard?.rarity ?? null,
      previousCount,
      observedToday,
    )

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
        p_base_xp: toBaseXp(earned.xp, previousCount),
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

    // 레벨은 누적 XP에서 다시 계산합니다. profiles.level은 예전 곡선으로 채워지므로
    // 저장된 값을 믿지 않습니다. 진짜 기준값은 언제나 누적 XP입니다.
    const progress = levelProgress(reward.total_xp)
    const previousLevel = levelProgress(
      reward.total_xp - reward.xp_awarded,
    ).level

    // 실제 지급액과 내역의 합이 어긋나면 설명을 내보내지 않습니다.
    // 틀린 근거를 보여주느니 총액만 보여주는 편이 낫습니다.
    const breakdown =
      reward.xp_awarded === earned.xp ? earned.breakdown : []
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
          breakdown,
          totalXp: reward.total_xp,
          level: progress.level,
          currentLevelXp: progress.currentXp,
          xpToNextLevel: progress.xpToNextLevel,
          leveledUp: progress.level > previousLevel,
          plantCount: reward.collection_count,
        },
      },
      201,
    )
  } catch (error) {
    return fail('관찰 기록 저장 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
