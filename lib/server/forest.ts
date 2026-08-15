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

function normalizedRank(value: string) {
  switch (value.toLowerCase().replace(/\.$/, '')) {
    case 'subsp':
    case 'ssp':
      return 'subsp'
    case 'var':
      return 'var'
    case 'f':
    case 'fo':
    case 'forma':
      return 'f'
    default:
      return null
  }
}

function canonicalScientificName(value: string) {
  const tokens = value
    .replace(/×/g, ' × ')
    .trim()
    .split(/\s+/)

  if (tokens.length < 2) return value.trim().toLowerCase()

  const canonical = [tokens[0].toLowerCase()]
  let index = 1

  if (tokens[index] === '×') {
    canonical.push('×')
    index += 1
  }

  const species = tokens[index]?.replace(/[(),]/g, '').toLowerCase()
  if (!species) return value.trim().toLowerCase()
  canonical.push(species)

  for (index += 1; index < tokens.length - 1; index += 1) {
    const rank = normalizedRank(tokens[index])
    if (!rank) continue

    const epithet = tokens[index + 1].replace(/[(),]/g, '').toLowerCase()
    if (!epithet) continue
    canonical.push(rank, epithet)
    index += 1
  }

  return canonical.join(' ')
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
    numOfRows: '5',
    reqSearchWrd: scientificName,
  })

  const expectedName = canonicalScientificName(scientificName)
  const items = [...searchXml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
    (match) => match[1],
  )
  const item = items.find((candidate) => {
    const foundName = value(candidate, 'plantSpecsScnm')
    return foundName
      ? canonicalScientificName(foundName) === expectedName
      : false
  })

  if (!item) return null

  const plantNumber = item && value(item, 'plantPilbkNo')

  if (!plantNumber) return null

  return getForestPlantByNumber(plantNumber, item)
}

export async function getForestPlantByNumber(
  plantNumber: string,
  searchItem?: string,
) {
  const detailXml = await request('plantPilbkInfo', {
    reqPlantPilbkNo: plantNumber,
  })

  return {
    koreanName:
      value(detailXml, 'plantGnrlNm') ||
      (searchItem ? value(searchItem, 'plantGnrlNm') : null),
    scientificName:
      value(detailXml, 'plantSpecsScnm') ||
      (searchItem ? value(searchItem, 'plantSpecsScnm') : null),
    description: value(detailXml, 'shpe') || value(detailXml, 'spft'),
  }
}
