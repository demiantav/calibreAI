import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { renderWithProviders, createMockFetch } from '@/test-utils'
import Dashboard from '../Dashboard'
import { PulseProvider } from '@/lib/pulse-context'
import { MemoryRouter } from 'react-router-dom'

const mockLogs = [
  {
    id: '1',
    creator_name: 'midudev',
    type: 'media_kit_update',
    content: { subscribers: 150000, totalViews: 5000000, engagementRate: 4.5, lastVideoViews: 300000 },
    insights: 'Análisis completado',
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: '2',
    type: 'agent_summary',
    content: { text: 'Resumen diario' },
    insights: 'Brief',
    created_at: '2026-05-20T11:00:00Z',
  },
  {
    id: '3',
    type: 'pitch_draft',
    content: { brandName: 'TechBrand', brandEmail: 'a@b.com', status: 'draft_ready' },
    insights: 'Pitch generado',
    created_at: '2026-05-20T09:00:00Z',
  },
  {
    id: '4',
    type: 'sponsorship_forecast',
    content: { mention: { min: 1000, max: 1500, currency: 'USD' } },
    insights: 'Forecast',
    created_at: '2026-05-20T08:00:00Z',
  },
]

describe('Dashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch logs on mount', async () => {
    const mock = createMockFetch().get('logs', mockLogs).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      expect(mock.called('logs')).toBe(true)
    })
    expect(mock.callCountFor('logs')).toBe(1)
  })

  it('should render MetricCards from fetched data', async () => {
    createMockFetch().get('logs', mockLogs).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      // 150,000 appears in hero and MetricCard
      expect(screen.getAllByText('150,000').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getByText('5,000,000')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    // $ prefix and value are in separate elements now
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('1,000')).toBeInTheDocument()
  })

  it('should show Daily Brief when agent_summary exists', async () => {
    createMockFetch().get('logs', mockLogs).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      expect(screen.getByText('Daily Brief')).toBeInTheDocument()
    })
    expect(screen.getByText('Resumen diario')).toBeInTheDocument()
  })

  it('should show Pending Pitches count when draft_ready exists', async () => {
    createMockFetch().get('logs', mockLogs).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
    expect(screen.getByText('Pending Pitches')).toBeInTheDocument()
  })

  it('should render creator name and follower count', async () => {
    createMockFetch().get('logs', mockLogs).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      expect(screen.getByText('midudev')).toBeInTheDocument()
    })
    expect(screen.getAllByText('150,000').length).toBeGreaterThanOrEqual(1)
    // "followers" appears in the hero tagline with surrounding spaces
    expect(screen.getByText(/followers/)).toBeInTheDocument()
  })

  it('should render without crash when API returns empty', async () => {
    createMockFetch().get('logs', []).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      // Default creator name renders when no data
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
    })
  })

  it('should support sequential fetch responses for polling scenarios', async () => {
    // This test verifies createMockFetch supports multiple responses for the same URL
    // (used by Dashboard polling mechanism)
    const mock = createMockFetch()
      .get('logs', [{ id: '1', type: 'media_kit_update', content: { subscribers: 1000 }, creator_name: 'Test', insights: '', created_at: '' }])
      .get('logs', [{ id: '2', type: 'media_kit_update', content: { subscribers: 2000 }, creator_name: 'Test', insights: '', created_at: '' }])
      .install()

    // Call 1
    const res1 = await fetch('http://localhost:8080/logs')
    const data1 = await res1.json()
    expect(data1[0].content.subscribers).toBe(1000)
    expect(mock.callCountFor('logs')).toBe(1)

    // Call 2 (simulating a polling re-fetch)
    const res2 = await fetch('http://localhost:8080/logs')
    const data2 = await res2.json()
    expect(data2[0].content.subscribers).toBe(2000)
    expect(mock.callCountFor('logs')).toBe(2)
  })

  it('should handle network error gracefully', async () => {
    createMockFetch().get('logs', new Error('Network error')).install()
    renderWithProviders(<Dashboard />)

    await vi.waitFor(() => {
      // Default creator name renders even on error
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument()
    })
  })
})
