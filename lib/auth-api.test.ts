import { describe, expect, it } from 'vitest'

import {
  clearAuthCookie,
  LOCAL_ID_DOMAIN,
  parseLocalId,
  parseLoginInput,
  parsePasswordInput,
  parseSignupInput,
  setAuthCookie,
} from './auth-api'

describe('email auth input', () => {
  it('normalizes a login email without changing the password', () => {
    expect(
      parseLoginInput({ email: ' User@Example.COM ', password: 'secret1' }),
    ).toEqual({
      success: true,
      data: { email: 'user@example.com', password: 'secret1', byLocalId: false },
    })
  })

  it('turns a login id into an address that can never be a real mailbox', () => {
    expect(parseLoginInput({ id: ' Sooji ', password: 'secret1' })).toEqual({
      success: true,
      data: {
        email: `sooji@${LOCAL_ID_DOMAIN}`,
        password: 'secret1',
        byLocalId: true,
      },
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

  it('refuses an email address as an id, which is what blocks pre-claiming', () => {
    for (const id of ['victim@gmail.com', 'a@b', 'name@']) {
      expect(parseLocalId(id).success).toBe(false)
    }

    expect(parseSignupInput({ id: 'victim@gmail.com', password: 'secret1' }).success).toBe(
      false,
    )
    // email 키로 우회하는 것도 막습니다.
    expect(
      parseSignupInput({ email: 'victim@gmail.com', password: 'secret1' }).success,
    ).toBe(false)
  })

  it('accepts a plain id and defaults the nickname to it', () => {
    const result = parseSignupInput({ id: 'Sooji_01', password: 'secret1' })

    expect(result.success && result.data).toEqual({
      id: 'sooji_01',
      email: `sooji_01@${LOCAL_ID_DOMAIN}`,
      password: 'secret1',
      nickname: 'sooji_01',
    })
  })

  it('rejects ids that are too short, too long, or use other characters', () => {
    expect(parseLocalId('ab').success).toBe(false)
    expect(parseLocalId('a'.repeat(21)).success).toBe(false)
    expect(parseLocalId('수지').success).toBe(false)
    expect(parseLocalId('so.oji').success).toBe(false)
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
