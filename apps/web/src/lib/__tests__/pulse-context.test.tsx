import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { PulseProvider, usePulse } from '../pulse-context'

describe('PulseProvider + usePulse', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render children', () => {
    render(<PulseProvider><div data-testid="child">hi</div></PulseProvider>)
    expect(screen.getByTestId('child')).toHaveTextContent('hi')
  })

  it('should start with idle status and null lastPulseAt', () => {
    const { result } = renderHook(() => usePulse(), { wrapper: PulseProvider })
    expect(result.current.pulseStatus).toBe('idle')
    expect(result.current.lastPulseAt).toBeNull()
  })

  it('should set pulsing and call fetch when triggerPulse is called', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchFn)

    const { result } = renderHook(() => usePulse(), { wrapper: PulseProvider })

    await act(async () => {
      await result.current.triggerPulse()
    })

    expect(result.current.pulseStatus).toBe('pulsing')
    expect(fetchFn).toHaveBeenCalledWith('http://localhost:8080/pulse', expect.objectContaining({ headers: expect.any(Object) }))
  })

  it('should update pulseStatus when setPulseStatus is called', () => {
    const { result } = renderHook(() => usePulse(), { wrapper: PulseProvider })

    act(() => { result.current.setPulseStatus('success') })
    expect(result.current.pulseStatus).toBe('success')

    act(() => { result.current.setPulseStatus('error') })
    expect(result.current.pulseStatus).toBe('error')

    act(() => { result.current.setPulseStatus('idle') })
    expect(result.current.pulseStatus).toBe('idle')
  })

  it('should update lastPulseAt on each triggerPulse call', async () => {
    vi.useFakeTimers()
    const fetchFn = vi.fn(() => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchFn)

    const { result } = renderHook(() => usePulse(), { wrapper: PulseProvider })
    expect(result.current.lastPulseAt).toBeNull()

    await act(async () => { await result.current.triggerPulse() })
    const first = result.current.lastPulseAt
    expect(first).toBeGreaterThan(0)

    vi.advanceTimersByTime(100)
    fetchFn.mockResolvedValueOnce({ ok: true })

    await act(async () => { await result.current.triggerPulse() })
    const second = result.current.lastPulseAt
    expect(second).toBeGreaterThan(first!)

    vi.useRealTimers()
  })
})
