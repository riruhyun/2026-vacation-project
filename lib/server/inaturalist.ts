const apiUrl = 'https://api.inaturalist.org/v2/taxa'

type Taxon = {
  id: number
  name: string
  preferred_common_name?: string
  rank?: string
  observations_count?: number
  wikipedia_summary?: string
  wikipedia_url?: string
  default_photo?: {
    medium_url?: string
    attribution?: string
    license_code?: string
  }
}

export async function getPlantInformation(scientificName: string) {
  const url = new URL(apiUrl)
  url.searchParams.set('q', scientificName)
  url.searchParams.set('rank', 'species')
  url.searchParams.set('locale', 'ko')
  url.searchParams.set(
    'fields',
    '(id:!t,name:!t,preferred_common_name:!t,rank:!t,observations_count:!t,wikipedia_summary:!t,wikipedia_url:!t,default_photo:(medium_url:!t,attribution:!t,license_code:!t))',
  )

  const response = await fetch(url, {
    headers: { 'User-Agent': 'chorokdogam' },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) throw new Error('iNaturalist API 요청에 실패했습니다.')

  const body = (await response.json()) as { results?: Taxon[] }
  const plant = body.results?.find(
    (item) => item.name.toLowerCase() === scientificName.toLowerCase(),
  )

  if (!plant) return null

  return {
    id: plant.id,
    koreanName: plant.preferred_common_name || null,
    scientificName: plant.name,
    rank: plant.rank || null,
    observationsCount: plant.observations_count || 0,
    summary: plant.wikipedia_summary || null,
    wikipediaUrl: plant.wikipedia_url || null,
    image: plant.default_photo?.medium_url
      ? {
          url: plant.default_photo.medium_url,
          attribution: plant.default_photo.attribution || null,
          license: plant.default_photo.license_code || null,
        }
      : null,
  }
}
