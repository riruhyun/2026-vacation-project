import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  lookupAccount: vi.fn(),
  markSitePassword: vi.fn(),
  updateUserById: vi.fn(),
  userIdFrom: vi.fn(),
}))

const NO_ACCOUNT = { exists: false, googleLinked: false, hasSitePassword: false }
const GOOGLE_ONLY = { exists: true, googleLinked: true, hasSitePassword: false }
const WITH_PASSWORD = { exists: true, googleLinked: true, hasSitePassword: true }

vi.mock('@/lib/server/account', () => ({
  lookupAccount: authMocks.lookupAccount,
  markSitePassword: authMocks.markSitePassword,
}))

vi.mock('@/lib/server/supabase', () => ({
  supabase: { auth: { admin: { updateUserById: authMocks.updateUserById } } },
}))

vi.mock('@/lib/server/auth', () => ({
  authErrorStatus: () => 401,
  createPublicAuthClient: () => ({
    auth: {
      signInWithPassword: authMocks.signInWithPassword,
      signUp: authMocks.signUp,
      admin: { signOut: authMocks.signOut },
    },
  }),
}))

vi.mock('@/lib/server/user', () => ({
  accessTokenFrom: () => 'existing-token',
  userIdFrom: authMocks.userIdFrom,
}))

import { POST as login } from './login/route'
import { POST as logout } from './logout/route'
import { POST as setPassword } from './password/route'
import { POST as signup } from './signup/route'

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('email auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.lookupAccount.mockResolvedValue(NO_ACCOUNT)
  })

  it('sets the Swagger-compatible session cookie after login', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-id', email: 'user@example.com' },
        session: {
          access_token: 'access-token',
          expires_at: 123456,
          expires_in: 3600,
        },
      },
      error: null,
    })

    const response = await login(
      jsonRequest('/api/auth/login', {
        email: 'user@example.com',
        password: 'secret1',
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain(
      'plant-access-token=access-token',
    )
    expect(await response.json()).toMatchObject({
      success: true,
      data: { authenticated: true, accessToken: 'access-token' },
    })
  })

  it('refuses email signup so an address cannot be claimed before its owner arrives', async () => {
    const response = await signup()

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error.details.reason).toBe('signup_closed')
    expect(body.error.message).toContain('Google')
    // 계정을 만드는 경로 자체가 없어야 합니다. 조회조차 하지 않습니다.
    expect(authMocks.signUp).not.toHaveBeenCalled()
    expect(authMocks.lookupAccount).not.toHaveBeenCalled()
  })

  it('guides a Google-only account to set a site password instead of failing the password check', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', status: 400 },
    })
    authMocks.lookupAccount.mockResolvedValue(GOOGLE_ONLY)

    const response = await login(
      jsonRequest('/api/auth/login', {
        email: 'user@example.com',
        password: 'guessing',
      }),
    )

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error.details.reason).toBe('google_only')
    expect(body.error.message).toContain('Google로 가입')
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('keeps the plain wrong-password message once a site password exists', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', status: 400 },
    })
    authMocks.lookupAccount.mockResolvedValue(WITH_PASSWORD)

    const response = await login(
      jsonRequest('/api/auth/login', { email: 'user@example.com', password: 'nope123' }),
    )

    expect(response.status).toBe(401)
    expect((await response.json()).error.details.reason).toBe('invalid_password')
  })

  it('tells an unknown email to start with Google', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', status: 400 },
    })

    const response = await login(
      jsonRequest('/api/auth/login', { email: 'nobody@example.com', password: 'secret1' }),
    )

    expect(response.status).toBe(401)
    expect((await response.json()).error.details.reason).toBe('not_registered')
  })

  it('refuses to set a site password without a session', async () => {
    authMocks.userIdFrom.mockResolvedValue(null)

    const response = await setPassword(
      jsonRequest('/api/auth/password', { password: 'secret1' }),
    )

    expect(response.status).toBe(401)
    expect(authMocks.updateUserById).not.toHaveBeenCalled()
  })

  it('sets a site password for the signed-in user and records the flag', async () => {
    authMocks.userIdFrom.mockResolvedValue('user-id')
    authMocks.updateUserById.mockResolvedValue({ error: null })
    authMocks.markSitePassword.mockResolvedValue(true)

    const response = await setPassword(
      jsonRequest('/api/auth/password', { password: 'secret1' }),
    )

    expect(response.status).toBe(200)
    expect(authMocks.updateUserById).toHaveBeenCalledWith('user-id', {
      password: 'secret1',
    })
    expect(authMocks.markSitePassword).toHaveBeenCalledWith('user-id')
    expect(await response.json()).toMatchObject({
      success: true,
      data: { hasSitePassword: true },
    })
  })

  it('revokes the refresh session and clears the cookie on logout', async () => {
    authMocks.signOut.mockResolvedValue({ error: null })

    const response = await logout(
      new Request('http://localhost/api/auth/logout', { method: 'POST' }),
    )

    expect(authMocks.signOut).toHaveBeenCalledWith('existing-token', 'local')
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
  })
})
