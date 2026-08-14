import 'server-only'

import { createClient } from '@supabase/supabase-js'

export function createPublicAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error('Supabase 공개 인증 환경변수가 필요합니다.')
  }

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

export function authErrorStatus(error: { status?: number; code?: string }) {
  if (error.code === 'email_not_confirmed') return 403
  if (error.status === 429) return 429
  return 401
}
