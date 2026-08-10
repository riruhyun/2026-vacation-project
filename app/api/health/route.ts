import { ok } from '@/lib/server/http'

// 환경변수가 제대로 채워졌는지 확인하는 용도입니다. 외부 API 할당량을 쓰지 않습니다.
export function GET() {
  return ok({
    status: 'ok',
    checkedAt: new Date().toISOString(),
    services: {
      supabase: Boolean(process.env.SUPABASE_SECRET_KEY),
      plantNet: Boolean(process.env.PLANTNET_API_KEY),
      iNaturalist: true,
    },
  })
}
