import { createClient } from '@supabase/supabase-js'

// 서버 전용입니다. 비밀 키를 사용하므로 클라이언트 컴포넌트에서 import하면 안 됩니다.
// (import만 해도 아래 검사에서 오류가 발생합니다.)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  throw new Error('Supabase 환경변수가 필요합니다.')
}

export const supabase = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
