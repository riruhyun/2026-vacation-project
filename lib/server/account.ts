import 'server-only'

import { supabase } from './supabase'

/** 로그인 화면이 어떤 안내를 띄울지 정하는 데 필요한 계정 상태입니다. */
export type AccountLookup = {
  exists: boolean
  /** 구글로 가입했거나 구글을 연결한 계정입니다. */
  googleLinked: boolean
  /** 사이트 전용 비밀번호를 설정했으면 true입니다. false면 구글로만 들어올 수 있습니다. */
  hasSitePassword: boolean
}

const UNKNOWN: AccountLookup = {
  exists: false,
  googleLinked: false,
  hasSitePassword: false,
}

type AdminUser = {
  id: string
  email?: string | null
  app_metadata?: { providers?: string[]; provider?: string } | null
}

/**
 * 이메일로 가입 이력을 찾습니다.
 *
 * supabase-js의 listUsers에는 이메일 필터가 없어서 GoTrue admin REST를 직접 부릅니다.
 * filter는 부분 일치 검색이므로 결과에서 이메일이 정확히 같은 것만 인정합니다.
 *
 * 계정 존재 여부를 알려주는 것은 의도한 선택입니다. Supabase는 계정 목록을 캐내지 못하도록
 * 이를 숨기지만, 우리는 "구글로 가입된 계정입니다"를 안내해야 해서 공개합니다.
 * 대신 판단은 서버에서만 하고 비밀번호 설정 여부는 우리 profiles 테이블에서 읽습니다.
 */
export async function lookupAccount(email: string): Promise<AccountLookup> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) return UNKNOWN

  const normalized = email.trim().toLowerCase()

  let user: AdminUser | undefined
  try {
    const response = await fetch(
      `${url}/auth/v1/admin/users?per_page=20&filter=${encodeURIComponent(normalized)}`,
      {
        headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
        cache: 'no-store',
      },
    )

    if (!response.ok) return UNKNOWN

    const body = (await response.json()) as { users?: AdminUser[] }
    user = body.users?.find((candidate) => candidate.email?.toLowerCase() === normalized)
  } catch {
    // 조회에 실패하면 계정이 없는 것처럼 다룹니다. 로그인 자체는 이미 실패한 뒤입니다.
    return UNKNOWN
  }

  if (!user) return UNKNOWN

  const providers = user.app_metadata?.providers ?? [
    user.app_metadata?.provider,
  ].filter((value): value is string => Boolean(value))

  const { data } = await supabase
    .from('profiles')
    .select('has_site_password')
    .eq('id', user.id)
    .maybeSingle()

  return {
    exists: true,
    googleLinked: providers.includes('google'),
    hasSitePassword: Boolean(data?.has_site_password),
  }
}

/** 사이트 전용 비밀번호를 설정했다고 기록합니다. */
export async function markSitePassword(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ has_site_password: true, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return !error
}
