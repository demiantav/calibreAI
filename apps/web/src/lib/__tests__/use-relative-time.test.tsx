import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RelativeTime, useRelativeTime } from '../use-relative-time'

// Freeze time at 2026-05-20T12:00:00Z
const NOW = new Date('2026-05-20T12:00:00Z')

describe('useRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "Just now" for timestamps less than 1 minute ago', () => {
    const iso = '2026-05-20T11:59:30.000Z' // 30s ago
    const { result } = renderHookInTest(() => useRelativeTime(iso))
    expect(result.current).toBe('Just now')
  })

  it('should return "5m ago" for timestamps 5 minutes ago', () => {
    const iso = '2026-05-20T11:55:00.000Z'
    const { result } = renderHookInTest(() => useRelativeTime(iso))
    expect(result.current).toBe('5m ago')
  })

  it('should return "2h ago" for timestamps 2 hours ago', () => {
    const iso = '2026-05-20T10:00:00.000Z'
    const { result } = renderHookInTest(() => useRelativeTime(iso))
    expect(result.current).toBe('2h ago')
  })

  it('should return "Yesterday" for timestamps ~1 day ago', () => {
    const iso = '2026-05-19T10:00:00.000Z'
    const { result } = renderHookInTest(() => useRelativeTime(iso))
    expect(result.current).toBe('Yesterday')
  })

  it('should return "3d ago" for timestamps 3 days ago', () => {
    const iso = '2026-05-17T10:00:00.000Z'
    const { result } = renderHookInTest(() => useRelativeTime(iso))
    expect(result.current).toBe('3d ago')
  })

  it('should return empty string for null or undefined', () => {
    const { result: r1 } = renderHookInTest(() => useRelativeTime(null))
    expect(r1.current).toBe('')
    const { result: r2 } = renderHookInTest(() => useRelativeTime(undefined))
    expect(r2.current).toBe('')
  })

  it('should return original string for invalid ISO', () => {
    const { result } = renderHookInTest(() => useRelativeTime('not-a-date'))
    expect(result.current).toBe('not-a-date')
  })
})

describe('RelativeTime component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render "2h ago" for timestamps 2 hours ago', () => {
    render(<RelativeTime iso="2026-05-20T10:00:00.000Z" />)
    expect(screen.getByText('2h ago')).toBeInTheDocument()
  })
})

import { renderHook } from '@testing-library/react'
function renderHookInTest<Result>(hook: () => Result) {
  return renderHook(hook)
}
