import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  lookupAccount: vi.fn(),
  markSitePassword: vi.fn(),
  updateUserById: vi.fn(),
  createUser: vi.fn(),
  userIdFrom: vi.fn(),
}))

const base = { isLocalId: false }
const NO_ACCOUNT = { ...base, exists: false, googleLinked: false, hasSitePassword: false }
const GOOGLE_ONLY = { ...base, exists: true, googleLinked: true, hasSitePassword: false }
const WITH_PASSWORD = { ...base, exists: true, googleLinked: true, hasSitePassword: true }
const LOCAL_ID = {
  exists: true,
  googleLinked: false,
  hasSitePassword: true,
  isLocalId: true,
}

vi.mock('@/lib/server/account', () => ({
  lookupAccount: authMocks.lookupAccount,
  markSitePassword: authMocks.markSitePassword,
}))

vi.mock('@/lib/server/supabase', () => ({
  supabase: {
    auth: {
      admin: {
        updateUserById: authMocks.updateUserById,
        createUser: authMocks.createUser,
      },
    },
  },
}))

vi.mock('@/lib/server/auth', () => ({
  authErrorStatus: () => 401,
  createPublicAuthClient: () => ({
    auth: {
      signInWithPassword: authMocks.signInWithPassword,
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

  it('refuses an email address as an id so a Gmail address cannot be claimed', async () => {
    const response = await signup(
      jsonRequest('/api/auth/signup', {
        id: 'victim@gmail.com',
        password: 'secret1',
      }),
    )

    expect(response.status).toBe(400)
    expect((await response.json()).error.message).toContain('이메일 주소를 쓸 수 없습니다')
    // 계정을 만드는 경로까지 가지 않아야 합니다.
    expect(authMocks.createUser).not.toHaveBeenCalled()
  })

  it('refuses an email field on signup as well', async () => {
    const response = await signup(
      jsonRequest('/api/auth/signup', {
        email: 'victim@gmail.com',
        password: 'secret1',
      }),
    )

    expect(response.status).toBe(400)
    expect(authMocks.createUser).not.toHaveBeenCalled()
  })

  it('stores an id under a domain that can never be a real address', async () => {
    authMocks.createUser.mockResolvedValue({
      data: { user: { id: 'user-id', email: 'sooji@id.plantdex.invalid' } },
      error: null,
    })
    authMocks.markSitePassword.mockResolvedValue(true)
    authMocks.signInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-id', email: 'sooji@id.plantdex.invalid' },
        session: { access_token: 'access-token', expires_at: 1, expires_in: 3600 },
      },
      error: null,
    })

    const response = await signup(
      jsonRequest('/api/auth/signup', { id: 'Sooji', password: 'secret1' }),
    )

    expect(response.status).toBe(201)
    expect(authMocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'sooji@id.plantdex.invalid',
        email_confirm: true,
      }),
    )
    // 확인 메일 단계가 없으므로 가입과 동시에 로그인됩니다.
    expect(response.headers.get('set-cookie')).toContain('plant-access-token=')
  })

  it('rejects an id that is already taken', async () => {
    authMocks.lookupAccount.mockResolvedValue(WITH_PASSWORD)

    const response = await signup(
      jsonRequest('/api/auth/signup', { id: 'sooji', password: 'secret1' }),
    )

    expect(response.status).toBe(409)
    expect((await response.json()).error.details.reason).toBe('id_taken')
    expect(authMocks.createUser).not.toHaveBeenCalled()
  })

  it('does not send Google guidance when an id login fails', async () => {
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: 'invalid_credentials', status: 400 },
    })
    authMocks.lookupAccount.mockResolvedValue(LOCAL_ID)

    const response = await login(
      jsonRequest('/api/auth/login', { id: 'sooji', password: 'wrong123' }),
    )

    expect(response.status).toBe(401)
    expect((await response.json()).error.details.reason).toBe('invalid_password')
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
