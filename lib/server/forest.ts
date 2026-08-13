const apiUrl = 'https://apis.data.go.kr/1400119/PlantResource'

function value(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  if (!match) return null

  return match[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeKey(key: string) {
  try {
    return decodeURIComponent(key)
  } catch {
    return key
  }
}

async function request(path: string, params: Record<string, string>) {
  const key = process.env.FOREST_API_KEY
  if (!key) throw new Error('FOREST_API_KEY가 설정되지 않았습니다.')

  const url = new URL(`${apiUrl}/${path}`)
  url.searchParams.set('serviceKey', decodeKey(key))

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value)
  }

  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('산림청 API 요청에 실패했습니다.')

  const xml = await response.text()
  if (value(xml, 'resultCode') !== '00') {
    throw new Error(value(xml, 'resultMsg') || '산림청 API 요청에 실패했습니다.')
  }

  return xml
}

export async function getForestPlant(
  scientificName: string,
) {
  const searchXml = await request('plantPilbkSearch', {
    pageNo: '1',
    numOfRows: '1',
    reqSearchWrd: scientificName,
  })

  const item = searchXml.match(/<item>([\s\S]*?)<\/item>/)?.[1]
  const expectedName = scientificName.toLowerCase()
  const foundName = item && value(item, 'plantSpecsScnm')?.toLowerCase()
  const exact =
    foundName === expectedName || foundName?.startsWith(`${expectedName} `)

  if (!item || !exact) return null

  const plantNumber = item && value(item, 'plantPilbkNo')

  if (!plantNumber) return null

  const detailXml = await request('plantPilbkInfo', {
    reqPlantPilbkNo: plantNumber,
  })

  return {
    koreanName:
      value(detailXml, 'plantGnrlNm') || value(item, 'plantGnrlNm'),
    scientificName:
      value(detailXml, 'plantSpecsScnm') || value(item, 'plantSpecsScnm'),
    description: value(detailXml, 'shpe') || value(detailXml, 'spft'),
  }
}
