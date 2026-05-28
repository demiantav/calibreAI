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
    expect(screen.getByText('Actividad')).toBeInTheDocument()
    expect(screen.getByText('Deals')).toBeInTheDocument()
    expect(screen.getByText('Tarifas')).toBeInTheDocument()
  })

  it('should render theme toggle', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const themeButton = screen.getByRole('button', { name: /Mode/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('should highlight active route', () => {
    render(
      <MemoryRouter initialEntries={['/deals']}>
        <Sidebar />
      </MemoryRouter>
    )

    const dealsLink = screen.getByText('Deals').closest('a')
    expect(dealsLink).toHaveClass('text-accent')
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

    // Mock user email displayed
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Pro Creator')).toBeInTheDocument()
  })

  it('should render auto-pitch toggle', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    expect(screen.getByText('Auto-pitch')).toBeInTheDocument()
    const toggle = screen.getByRole('switch', { name: 'Activar auto-pitch' })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  it('should render accessible auto-pitch toggle', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    )

    const toggle = screen.getByRole('switch', { name: 'Activar auto-pitch' })
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle).toHaveAttribute('aria-label', 'Activar auto-pitch')
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
