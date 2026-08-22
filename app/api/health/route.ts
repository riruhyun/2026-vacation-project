import { ok } from '@/lib/server/http'

export function GET() {
  return ok({
    status: 'ok',
    checkedAt: new Date().toISOString(),
    services: {
      supabase: Boolean(process.env.SUPABASE_SECRET_KEY),
      plantNet: Boolean(process.env.PLANTNET_API_KEY),
      forest: Boolean(process.env.FOREST_API_KEY),
    },
  })
}
