import { errorMessage, fail, ok } from '@/lib/server/http'
import { imageError, imageExtension, imageUrl } from '@/lib/server/image'
import { toObservationDto } from '@/lib/server/observation'
import { supabase } from '@/lib/server/supabase'
import { userIdFrom } from '@/lib/server/user'

export const runtime = 'nodejs'

type PlantRow = {
  id: number
  korean_name: string
  scientific_name: string
}

function text(form: FormData, key: string) {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  const userId = userIdFrom(request)
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

    let plant: PlantRow | null = null
    if (plantId !== null) {
      const { data, error } = await supabase
        .from('plants')
        .select('id,korean_name,scientific_name')
        .eq('id', plantId)
        .maybeSingle()

      if (error) throw error
      if (!data) return fail('공식 식물을 찾을 수 없습니다.', 404)
      plant = data
    }

    const scientificName = plant?.scientific_name || text(form, 'scientificName')
    const displayName = plant?.korean_name || text(form, 'displayName')

    if (!scientificName || !displayName) {
      return fail('기타 식물은 scientificName과 displayName이 필요합니다.')
    }

    let duplicateQuery = supabase
      .from('observations')
      .select('id')
      .eq('user_id', userId)

    duplicateQuery = plant
      ? duplicateQuery.eq('plant_id', plant.id)
      : duplicateQuery.is('plant_id', null).eq('scientific_name', scientificName)

    const { data: existing, error: duplicateError } = await duplicateQuery
      .limit(1)
      .maybeSingle()

    if (duplicateError) throw duplicateError

    const path = `${userId}/${crypto.randomUUID()}.${imageExtension(image)}`
    const { error: uploadError } = await supabase.storage
      .from('observations')
      .upload(path, await image.arrayBuffer(), {
        contentType: image.type,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: observation, error: insertError } = await supabase
      .from('observations')
      .insert({
        user_id: userId,
        plant_id: plant?.id ?? null,
        scientific_name: scientificName,
        display_name: displayName,
        image_path: path,
      })
      .select('id,plant_id,scientific_name,display_name,image_path,observed_at')
      .single()

    if (insertError) {
      await supabase.storage.from('observations').remove([path])
      throw insertError
    }

    return ok(
      {
        result: existing ? 'duplicate' : 'new',
        observation: toObservationDto(
          observation,
          imageUrl(observation.image_path),
        ),
      },
      201,
    )
  } catch (error) {
    return fail('관찰 기록 저장 중 오류가 발생했습니다.', 500, errorMessage(error))
  }
}
