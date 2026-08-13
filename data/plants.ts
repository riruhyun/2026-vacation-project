import type { PlantStage, RarityCode } from '@/types/domain'

export type OfficialPlant = {
  id: number
  stage: PlantStage
  koreanName: string
  scientificName: string
  rarity: RarityCode
}

const rarityByStage: Record<PlantStage, RarityCode> = {
  1: 'common',
  2: 'uncommon',
  3: 'rare',
}

function plant(
  id: number,
  stage: PlantStage,
  koreanName: string,
  scientificName: string,
): OfficialPlant {
  return { id, stage, koreanName, scientificName, rarity: rarityByStage[stage] }
}

export const OFFICIAL_PLANTS = [
  plant(1, 1, '질경이', 'Plantago asiatica'),
  plant(2, 1, '괭이밥', 'Oxalis corniculata'),
  plant(3, 1, '개망초', 'Erigeron annuus'),
  plant(4, 1, '강아지풀', 'Setaria viridis'),
  plant(5, 1, '쇠비름', 'Portulaca oleracea'),
  plant(6, 1, '달맞이꽃', 'Oenothera biennis'),
  plant(7, 1, '토끼풀', 'Trifolium repens'),
  plant(8, 1, '닭의장풀', 'Commelina communis'),
  plant(9, 1, '명아주', 'Chenopodium album'),
  plant(10, 1, '바랭이', 'Digitaria ciliaris'),
  plant(11, 1, '왕바랭이', 'Eleusine indica'),
  plant(12, 1, '냉이', 'Capsella bursa-pastoris'),
  plant(13, 1, '별꽃', 'Stellaria media'),
  plant(14, 1, '민들레', 'Taraxacum officinale'),
  plant(15, 1, '개쑥갓', 'Senecio vulgaris'),
  plant(16, 1, '깨풀', 'Acalypha australis'),

  plant(17, 2, '제비꽃', 'Viola mandshurica'),
  plant(18, 2, '꽃마리', 'Trigonotis peduncularis'),
  plant(19, 2, '주름잎', 'Mazus pumilus'),
  plant(20, 2, '국수나무', 'Neillia incisa'),
  plant(21, 2, '사상자', 'Torilis japonica'),
  plant(22, 2, '애기메꽃', 'Calystegia hederacea'),
  plant(23, 2, '개여뀌', 'Persicaria longiseta'),
  plant(24, 2, '여뀌', 'Persicaria hydropiper'),
  plant(25, 2, '환삼덩굴', 'Humulus scandens'),
  plant(26, 2, '머위', 'Petasites japonicus'),
  plant(27, 2, '약모밀', 'Houttuynia cordata'),
  plant(28, 2, '갈퀴덩굴', 'Galium spurium'),
  plant(29, 2, '미국가막사리', 'Bidens frondosa'),

  plant(30, 3, '뱀딸기', 'Potentilla indica'),
  plant(31, 3, '산박하', 'Isodon inflexus'),
  plant(32, 3, '고마리', 'Persicaria thunbergii'),
  plant(33, 3, '물봉선', 'Impatiens textorii'),
  plant(34, 3, '도깨비바늘', 'Bidens bipinnata'),
  plant(35, 3, '며느리밑씻개', 'Persicaria senticosa'),
  plant(36, 3, '큰개불알풀', 'Veronica persica'),
  plant(37, 3, '며느리배꼽', 'Persicaria perfoliata'),
  plant(38, 3, '털여뀌', 'Persicaria orientalis'),
  plant(39, 3, '흰여뀌', 'Persicaria lapathifolia'),
  plant(40, 3, '미꾸리낚시', 'Persicaria sagittata'),
  plant(41, 3, '이삭여뀌', 'Persicaria filiformis'),
  plant(42, 3, '갈퀴나물', 'Vicia amoena'),
  plant(43, 3, '이질풀', 'Geranium thunbergii'),
  plant(44, 3, '쥐오줌풀', 'Valeriana fauriei'),
  plant(45, 3, '벌개미취', 'Aster koraiensis'),
  plant(46, 3, '개미취', 'Aster tataricus'),
  plant(47, 3, '참취', 'Aster scaber'),
  plant(48, 3, '짚신나물', 'Agrimonia pilosa'),
  plant(49, 3, '미나리', 'Oenanthe javanica'),
  plant(50, 3, '배초향', 'Agastache rugosa'),
] as const

const byId = new Map(OFFICIAL_PLANTS.map((item) => [item.id, item]))
const byScientificName = new Map(
  OFFICIAL_PLANTS.map((item) => [item.scientificName.toLowerCase(), item]),
)

export function getOfficialPlantById(id: number) {
  return byId.get(id) || null
}

export function getOfficialPlant(scientificName: string) {
  return byScientificName.get(scientificName.trim().toLowerCase()) || null
}
