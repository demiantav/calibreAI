import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMockFetch } from '@/test-utils'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

describe('Sidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render navigation items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('Pitches')).toBeInTheDocument()
    expect(screen.getByText('Rates')).toBeInTheDocument()
  })

  it('should render bottom items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('should highlight active route', () => {
    render(
      <MemoryRouter initialEntries={['/pitches']}>
        <Sidebar />
      </MemoryRouter>
    )

    const pitchesLink = screen.getByText('Pitches').closest('a')
    expect(pitchesLink).toHaveClass('text-accent')
  })

  it('should fetch profile data on mount', async () => {
    const mock = createMockFetch().get('logs', [
      { id: '1', creator_name: 'TestCreator', type: 'media_kit_update', content: { subscribers: 250000 }, insights: '', created_at: '' },
    ]).install()

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(mock.called('logs')).toBe(true)
    })
  })

  it('should render creator profile with fallback data', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    // Fallback data before fetch completes
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
    expect(screen.getByText('Pro Creator')).toBeInTheDocument()
  })

  it('should render theme toggle button', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const themeButton = screen.getByRole('button', { name: /Mode/i })
    expect(themeButton).toBeInTheDocument()
  })
})
