import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
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
}))

import { POST as login } from './login/route'
import { POST as logout } from './logout/route'
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

  it('reports when signup requires email confirmation', async () => {
    authMocks.signUp.mockResolvedValue({
      data: {
        user: { id: 'user-id', email: 'user@example.com' },
        session: null,
      },
      error: null,
    })

    const response = await signup(
      jsonRequest('/api/auth/signup', {
        email: 'user@example.com',
        password: 'secret1',
        nickname: '초록 수집가',
      }),
    )

    expect(response.status).toBe(201)
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(await response.json()).toMatchObject({
      success: true,
      data: {
        authenticated: false,
        emailConfirmationRequired: true,
        accessToken: null,
      },
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
