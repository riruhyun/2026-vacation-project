import { errorMessage, fail, ok } from '@/lib/server/http'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

type ObservationRow = {
  plant_id: number | null
  scientific_name: string
  observed_at: string
}

export async function GET(request: Request) {
  const userId = userIdFrom(request)
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nickname,xp')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError

    const { data, error } = await supabase
      .from('observations')
      .select('plant_id,scientific_name,observed_at')
      .eq('user_id', userId)
      .order('observed_at', { ascending: false })

    if (error) throw error

    const observations = (data || []) as ObservationRow[]
    const officialPlantIds = new Set(
      observations.flatMap((item) => (item.plant_id ? [item.plant_id] : [])),
    )
    const otherScientificNames = new Set(
      observations
        .filter((item) => item.plant_id === null)
        .map((item) => item.scientific_name),
    )

    const { count, error: countError } = await supabase
      .from('plants')
      .select('id', { count: 'exact', head: true })

    if (countError) throw countError

    const totalPlants = count || 0

    return ok({
      profile: {
        nickname: profile?.nickname || null,
        xp: profile?.xp || 0,
      },
      stats: {
        totalObservations: observations.length,
        officialPlants: officialPlantIds.size,
        otherPlants: otherScientificNames.size,
        completionRate: totalPlants
          ? Math.round((officialPlantIds.size / totalPlants) * 100)
          : 0,
        lastObservedAt: observations[0]?.observed_at || null,
      },
    })
  } catch (error) {
    return fail('프로필 통계 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
