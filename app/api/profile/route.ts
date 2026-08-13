import { getOfficialPlant, OFFICIAL_PLANTS } from '@/data/plants'
import { errorMessage, fail, ok } from '@/lib/server/http'
import { levelProgress } from '@/lib/progress'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

type CountRow = {
  scientific_name: string
  count: number
  updated_at: string
}

export async function GET(request: Request) {
  const userId = userIdFrom(request)
  if (!userId) return fail('x-user-id에 사용자 UUID가 필요합니다.', 401)

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nickname,xp,level')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) throw profileError

    const { data, error } = await supabase
      .from('user_plant_counts')
      .select('scientific_name,count,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    const counts = (data || []) as CountRow[]
    const officialPlants = counts.filter((item) =>
      getOfficialPlant(item.scientific_name),
    )
    const otherPlants = counts.length - officialPlants.length
    const xp = profile?.xp || 0
    const progress = levelProgress(xp)

    return ok({
      profile: {
        nickname: profile?.nickname || null,
        xp,
        level: profile?.level || progress.level,
        currentLevelXp: progress.currentXp,
        xpToNextLevel: progress.xpToNextLevel,
      },
      stats: {
        totalObservations: counts.reduce((sum, item) => sum + item.count, 0),
        officialPlants: officialPlants.length,
        otherPlants,
        completionRate: Math.round(
          (officialPlants.length / OFFICIAL_PLANTS.length) * 100,
        ),
        lastObservedAt: counts[0]?.updated_at || null,
      },
    })
  } catch (error) {
    return fail('프로필 통계 조회 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
