import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Layout from '../Layout'
import { PulseProvider } from '@/lib/pulse-context'
import { MemoryRouter } from 'react-router-dom'
import { type ReactElement } from 'react'

function renderLayout(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <PulseProvider>
        {ui}
      </PulseProvider>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('should render children', () => {
    renderLayout(<Layout><div data-testid="child">content</div></Layout>)
    expect(screen.getByTestId('child')).toHaveTextContent('content')
  })

  it('should render AgentIndicator and PulseButton', () => {
    renderLayout(<Layout><div>child</div></Layout>)
    expect(screen.getByText('AI Agent Active')).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2)
  })

  it('should auto-clear success status after 2s', async () => {
    // Render inside PulseProvider so we can manipulate status
    function TestLayout() {
      return <Layout><div>child</div></Layout>
    }
    const { result } = renderHookInLayout()

    act(() => { result.current.setPulseStatus('success') })
    expect(result.current.pulseStatus).toBe('success')

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.pulseStatus).toBe('idle')
  })

  it('should auto-clear error status after 2s', async () => {
    const { result } = renderHookInLayout()

    act(() => { result.current.setPulseStatus('error') })
    expect(result.current.pulseStatus).toBe('error')

    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.pulseStatus).toBe('idle')
  })
})

import { renderHook } from '@testing-library/react'
import { usePulse } from '@/lib/pulse-context'

function renderHookInLayout() {
  return renderHook(() => usePulse(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter>
        <PulseProvider>
          <Layout>{children}</Layout>
        </PulseProvider>
      </MemoryRouter>
    ),
  })
}
