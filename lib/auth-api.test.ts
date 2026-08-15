import { describe, expect, it } from 'vitest'

import {
  clearAuthCookie,
  parseLoginInput,
  parsePasswordInput,
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

  it('rejects a malformed email and a short password', () => {
    expect(parseLoginInput({ email: 'invalid', password: 'secret1' }).success).toBe(
      false,
    )
    expect(
      parseLoginInput({ email: 'user@example.com', password: '12345' }).success,
    ).toBe(false)
  })

  it('accepts a site password of at least six characters', () => {
    expect(parsePasswordInput({ password: 'secret1' })).toEqual({
      success: true,
      data: { password: 'secret1' },
    })
    expect(parsePasswordInput({ password: '12345' }).success).toBe(false)
    expect(parsePasswordInput({ password: 123456 }).success).toBe(false)
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
