import { AUTH_COOKIE } from '@/lib/auth-cookie'
import { NICKNAME_MAX_LENGTH } from '@/lib/profile-limits'

export const AUTH_PASSWORD_MIN_LENGTH = 6

/**
 * 이름을 알 수 없을 때 쓰는 닉네임입니다.
 *
 * 아이디 가입은 아이디를 닉네임으로 쓰므로 여기까지 오지 않습니다.
 * 실제로 이 값이 들어가는 곳은 구글 가입이고, 판단은 DB 트리거가 합니다
 * (supabase/profile-onboarding-migration.sql의 handle_new_user).
 * 같은 문자열이 SQL에도 적혀 있으니 바꿀 때는 두 곳을 함께 고쳐야 합니다.
 */
export const DEFAULT_NICKNAME = '식물 탐험가'

export const LOCAL_ID_MIN_LENGTH = 3
export const LOCAL_ID_MAX_LENGTH = 20

/**
 * 아이디 가입 계정을 Supabase에 저장할 때 붙이는 도메인입니다.
 *
 * .invalid는 RFC 2606이 예약한 최상위 도메인이라 누구도 등록할 수 없습니다.
 * 즉 이 주소는 실제 메일 주소가 될 수 없고, 구글 계정의 주소와 절대 겹치지 않습니다.
 * 겹치지 않으면 Supabase의 이메일 기반 계정 병합도 일어나지 않으므로,
 * 남의 지메일 주소를 미리 선점하는 일이 구조적으로 불가능합니다.
 */
export const LOCAL_ID_DOMAIN = 'id.plantdex.invalid'

/** 아이디는 소문자, 숫자, 밑줄만 허용합니다. @와 .을 막아 이메일 형식이 될 수 없게 합니다. */
const LOCAL_ID_PATTERN = /^[a-z0-9_]+$/

/** 아이디를 Supabase가 요구하는 이메일 형태로 바꿉니다. */
export function localIdToEmail(id: string) {
  return `${id}@${LOCAL_ID_DOMAIN}`
}

/** 아이디 가입으로 만든 계정인지 확인합니다. */
export function isLocalIdEmail(email: string | null | undefined) {
  return Boolean(email?.toLowerCase().endsWith(`@${LOCAL_ID_DOMAIN}`))
}

/** 저장된 주소에서 사용자가 입력했던 아이디를 되돌립니다. 화면 표시에 씁니다. */
export function emailToLocalId(email: string) {
  return isLocalIdEmail(email) ? email.slice(0, -`@${LOCAL_ID_DOMAIN}`.length) : email
}

/**
 * 로그인 화면이 어떤 안내를 띄울지 고르는 값입니다.
 * 응답의 error.details.reason으로 내려가므로 문구가 바뀌어도 화면이 깨지지 않습니다.
 */
export type AuthFailureReason =
  | 'google_only'
  | 'not_registered'
  | 'invalid_password'
  | 'email_not_confirmed'
  | 'id_taken'

export const AUTH_MESSAGES = {
  /** 구글로만 가입된 계정에 이메일/비밀번호로 들어오려는 경우입니다. */
  googleOnly:
    '이 계정은 Google로 가입되었습니다. 이메일/비밀번호를 사용하려면 사이트 전용 비밀번호를 먼저 설정해 주세요.',
  notRegistered: '등록되지 않은 아이디입니다.',
  notRegisteredEmail: '가입되지 않은 이메일입니다. Google로 시작해 주세요.',
  invalidPassword: '비밀번호가 올바르지 않습니다.',
  emailNotConfirmed: '이메일 확인이 필요합니다.',
  idTaken: '이미 사용 중인 아이디입니다.',
  emailAsId:
    '아이디에는 이메일 주소를 쓸 수 없습니다. 메일 주소로 시작하시려면 Google로 계속하기를 사용해 주세요.',
} as const

type AuthInput = {
  email: string
  password: string
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; message: string }

function objectBody(body: unknown): Record<string, unknown> | null {
  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null
}

function passwordFrom(input: Record<string, unknown>): ParseResult<string> {
  if (typeof input.password !== 'string') {
    return { success: false, message: 'password는 문자열이어야 합니다.' }
  }

  if (input.password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message: `password는 ${AUTH_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    }
  }

  return { success: true, data: input.password }
}

/**
 * 아이디를 검사합니다. 여기가 선점 공격을 막는 지점입니다.
 *
 * @를 막으면 아이디가 이메일 형식이 될 수 없고, 저장될 때 붙는 도메인이 .invalid라
 * 실제 지메일 주소와 같은 값이 나올 수 없습니다. 같은 값이 없으면 Supabase가 계정을
 * 합치지 않으므로, 남의 주소를 미리 차지해 두는 방법 자체가 사라집니다.
 */
export function parseLocalId(value: unknown): ParseResult<string> {
  if (typeof value !== 'string') {
    return { success: false, message: 'id는 문자열이어야 합니다.' }
  }

  const id = value.trim().toLowerCase()

  if (id.includes('@')) {
    return { success: false, message: AUTH_MESSAGES.emailAsId }
  }

  if (id.length < LOCAL_ID_MIN_LENGTH || id.length > LOCAL_ID_MAX_LENGTH) {
    return {
      success: false,
      message: `아이디는 ${LOCAL_ID_MIN_LENGTH}자 이상 ${LOCAL_ID_MAX_LENGTH}자 이하여야 합니다.`,
    }
  }

  if (!LOCAL_ID_PATTERN.test(id)) {
    return {
      success: false,
      message: '아이디에는 영문 소문자, 숫자, 밑줄만 쓸 수 있습니다.',
    }
  }

  return { success: true, data: id }
}

export type LoginInput = AuthInput & {
  /** 아이디로 들어온 요청이면 true입니다. 실패 안내 문구를 고르는 데 씁니다. */
  byLocalId: boolean
}

/**
 * 로그인 본문을 읽습니다. 아이디(`id`)와 이메일(`email`) 두 가지를 받습니다.
 *
 * - `id`: 아이디로 가입한 계정
 * - `email`: 구글로 가입한 뒤 사이트 전용 비밀번호를 설정한 계정
 */
export function parseLoginInput(body: unknown): ParseResult<LoginInput> {
  const input = objectBody(body)
  if (!input) return { success: false, message: 'JSON 객체가 필요합니다.' }

  const password = passwordFrom(input)
  if (!password.success) return password

  const hasId = input.id !== undefined
  const hasEmail = input.email !== undefined

  if (hasId && hasEmail) {
    return { success: false, message: 'id와 email 중 하나만 보내야 합니다.' }
  }

  if (hasId) {
    const id = parseLocalId(input.id)
    if (!id.success) return id

    return {
      success: true,
      data: { email: localIdToEmail(id.data), password: password.data, byLocalId: true },
    }
  }

  if (typeof input.email !== 'string') {
    return { success: false, message: 'id 또는 email이 필요합니다.' }
  }

  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: '올바른 이메일 주소가 필요합니다.' }
  }

  return { success: true, data: { email, password: password.data, byLocalId: false } }
}

export type SignupInput = {
  id: string
  email: string
  password: string
  nickname: string
}

/** 아이디 회원가입 본문입니다. 이메일 주소는 받지 않습니다. */
export function parseSignupInput(body: unknown): ParseResult<SignupInput> {
  const input = objectBody(body)
  if (!input) return { success: false, message: 'JSON 객체가 필요합니다.' }

  // 이메일로 가입하려는 요청은 아이디 규칙에 걸리기 전에 이유를 알려줍니다.
  if (input.email !== undefined) {
    return { success: false, message: AUTH_MESSAGES.emailAsId }
  }

  const id = parseLocalId(input.id)
  if (!id.success) return id

  const password = passwordFrom(input)
  if (!password.success) return password

  if (input.nickname !== undefined && typeof input.nickname !== 'string') {
    return { success: false, message: 'nickname은 문자열이어야 합니다.' }
  }

  const nickname =
    typeof input.nickname === 'string' && input.nickname.trim()
      ? input.nickname.trim()
      : id.data

  if (nickname.length > NICKNAME_MAX_LENGTH) {
    return {
      success: false,
      message: `nickname은 ${NICKNAME_MAX_LENGTH}자 이하여야 합니다.`,
    }
  }

  return {
    success: true,
    data: {
      id: id.data,
      email: localIdToEmail(id.data),
      password: password.data,
      nickname,
    },
  }
}

/** 사이트 전용 비밀번호를 설정할 때 쓰는 본문입니다. 이미 로그인한 사용자만 부를 수 있습니다. */
export function parsePasswordInput(body: unknown): ParseResult<{ password: string }> {
  const input = objectBody(body)
  if (!input) return { success: false, message: 'JSON 객체가 필요합니다.' }

  if (typeof input.password !== 'string') {
    return { success: false, message: 'password는 문자열이어야 합니다.' }
  }

  if (input.password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message: `password는 ${AUTH_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    }
  }

  return { success: true, data: { password: input.password } }
}

export function setAuthCookie(response: Response, token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const seconds = Math.max(0, Math.floor(maxAge))
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${secure}`,
  )
  return response
}

export function clearAuthCookie(response: Response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.append(
    'Set-Cookie',
    `${AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`,
  )
  return response
}
