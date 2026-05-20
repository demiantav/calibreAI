import { describe, it, expect } from 'vitest'

// ─── SUT ────────────────────────────────────────────────────────────────────────

// These pure functions are not exported from tool-executor.ts.
// We duplicate them here for focused testing.
// When the source exports them, replace imports.

function normalizeEmail(email: string): string {
  return email.replace(/.*<([^>]+)>.*/, '$1').replace(/["']/g, '').trim().toLowerCase()
}

function decodeRFC2047(input: string): string {
  return input.replace(/=\?([^?]+)\?[Bb]\?([^?]*)\?=/g, (_m: string, charset: string, encoded: string) => {
    try {
      const bytes = Buffer.from(encoded, 'base64')
      return new TextDecoder(charset).decode(bytes)
    } catch {
      return encoded
    }
  })
}

// ─── normalizeEmail ─────────────────────────────────────────────────────────────

describe('normalizeEmail', () => {
  it('should extract email from "Name <email>" format', () => {
    expect(normalizeEmail('John Doe <john@test.com>')).toBe('john@test.com')
  })

  it('should extract email from bare angle brackets', () => {
    expect(normalizeEmail('<john@test.com>')).toBe('john@test.com')
  })

  it('should return clean email unchanged when no brackets', () => {
    expect(normalizeEmail('john@test.com')).toBe('john@test.com')
  })

  it('should handle quoted display name', () => {
    expect(normalizeEmail('"Jane Doe" <jane@test.com>')).toBe('jane@test.com')
  })

  it('should lowercase the result', () => {
    expect(normalizeEmail('John <JOHN@TEST.COM>')).toBe('john@test.com')
  })

  it('should trim whitespace around brackets', () => {
    expect(normalizeEmail('  John <john@test.com>  ')).toBe('john@test.com')
  })

  it('should handle angle bracket in display name', () => {
    expect(normalizeEmail('"John <Doe>" <john@test.com>')).toBe('john@test.com')
  })

  it('should handle empty string', () => {
    expect(normalizeEmail('')).toBe('')
  })
})

// ─── decodeRFC2047 ──────────────────────────────────────────────────────────────

describe('decodeRFC2047', () => {
  it('should decode base64 UTF-8 encoded subject', () => {
    const encoded = '=?UTF-8?B?QXN1bnRvOiBwcsOzdmVjaGE=?='
    expect(decodeRFC2047(encoded)).toBe('Asunto: próvecha')
  })

  it('should return plain text unchanged', () => {
    expect(decodeRFC2047('Hello world')).toBe('Hello world')
  })

  it('should handle mixed plain and encoded parts', () => {
    const encoded = 'Re: =?UTF-8?B?YXN1bnRv?='
    expect(decodeRFC2047(encoded)).toBe('Re: asunto')
  })

  it('should handle multiple encoded parts', () => {
    const encoded = '=?UTF-8?B?aG9sYQ==?= =?UTF-8?B?bcOhcw==?='
    expect(decodeRFC2047(encoded)).toBe('hola más')
  })

  it('should handle base64 encoded string', () => {
    const encoded = '=?UTF-8?B?SG9sYSBtdW5kbw==?='
    expect(decodeRFC2047(encoded)).toBe('Hola mundo')
  })

  it('should handle empty string', () => {
    expect(decodeRFC2047('')).toBe('')
  })

  it('should handle encoded string with no match', () => {
    expect(decodeRFC2047('=?UTF-8?Q?hello?=')).toBe('=?UTF-8?Q?hello?=')
  })
})
