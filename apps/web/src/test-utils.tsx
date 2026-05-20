import { type ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, type RenderResult } from '@testing-library/react'
import { ThemeProvider } from '@/lib/theme'
import { PulseProvider } from '@/lib/pulse-context'

export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <PulseProvider>
          {ui}
        </PulseProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

export function mockFetchResponse(data: any, status = 200) {
  const fn = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
    })
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

export function mockFetchNetworkError() {
  const fn = vi.fn(() => Promise.reject(new Error('Network error')))
  vi.stubGlobal('fetch', fn)
  return fn
}
