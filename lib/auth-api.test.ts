import { describe, expect, it } from 'vitest'

import {
  clearAuthCookie,
  DEFAULT_NICKNAME,
  parseLoginInput,
  parseSignupInput,
  setAuthCookie,
} from './auth-api'

describe('email auth input', () => {
  it('normalizes a login email without changing the password', () => {
    expect(
      parseLoginInput({ email: ' User@Example.COM ', password: 'secret1' }),
    ).toEqual({
      success: true,
      data: { email: 'user@example.com', password: 'secret1' },
    })
  })

  it('uses the default nickname for signup', () => {
    const result = parseSignupInput({
      email: 'user@example.com',
      password: 'secret1',
    })

    expect(result.success && result.data.nickname).toBe(DEFAULT_NICKNAME)
  })

  it('rejects malformed email, short password, and empty nickname', () => {
    expect(parseLoginInput({ email: 'invalid', password: 'secret1' }).success).toBe(
      false,
    )
    expect(
      parseLoginInput({ email: 'user@example.com', password: '12345' }).success,
    ).toBe(false)
    expect(
      parseSignupInput({
        email: 'user@example.com',
        password: 'secret1',
        nickname: '   ',
      }).success,
    ).toBe(false)
  })
})

describe('auth cookie', () => {
  it('sets an HttpOnly same-origin session cookie', () => {
    const response = setAuthCookie(Response.json({}), 'header.payload.signature', 3600)
    const cookie = response.headers.get('set-cookie')

    expect(cookie).toContain('plant-access-token=header.payload.signature')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=3600')
  })

  it('clears the session cookie', () => {
    const response = clearAuthCookie(Response.json({}))
    const cookie = response.headers.get('set-cookie')

    expect(cookie).toContain('plant-access-token=')
    expect(cookie).toContain('Max-Age=0')
  })
})
