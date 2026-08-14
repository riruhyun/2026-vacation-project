import { AUTH_COOKIE } from '@/lib/auth-cookie'
import { NICKNAME_MAX_LENGTH } from '@/lib/profile-limits'

export const AUTH_PASSWORD_MIN_LENGTH = 6
export const DEFAULT_NICKNAME = '식물 탐험가'

type AuthInput = {
  email: string
  password: string
}

export type SignupInput = AuthInput & {
  nickname: string
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; message: string }

function objectBody(body: unknown): Record<string, unknown> | null {
  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : null
}

function credentialsFrom(body: unknown): ParseResult<AuthInput> {
  const input = objectBody(body)
  if (!input) return { success: false, message: 'JSON 객체가 필요합니다.' }

  if (typeof input.email !== 'string') {
    return { success: false, message: 'email은 문자열이어야 합니다.' }
  }

  const email = input.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: '올바른 이메일 주소가 필요합니다.' }
  }

  if (typeof input.password !== 'string') {
    return { success: false, message: 'password는 문자열이어야 합니다.' }
  }

  if (input.password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return {
      success: false,
      message: `password는 ${AUTH_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`,
    }
  }

  return { success: true, data: { email, password: input.password } }
}

export function parseLoginInput(body: unknown): ParseResult<AuthInput> {
  return credentialsFrom(body)
}

export function parseSignupInput(body: unknown): ParseResult<SignupInput> {
  const credentials = credentialsFrom(body)
  if (!credentials.success) return credentials

  const input = body as Record<string, unknown>
  if (input.nickname !== undefined && typeof input.nickname !== 'string') {
    return { success: false, message: 'nickname은 문자열이어야 합니다.' }
  }

  const nickname =
    typeof input.nickname === 'string' ? input.nickname.trim() : DEFAULT_NICKNAME

  if (nickname.length < 1 || nickname.length > NICKNAME_MAX_LENGTH) {
    return {
      success: false,
      message: `nickname은 1자 이상 ${NICKNAME_MAX_LENGTH}자 이하여야 합니다.`,
    }
  }

  return { success: true, data: { ...credentials.data, nickname } }
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
