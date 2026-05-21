import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMockFetch } from '@/test-utils'
import Sponsorship from '../Sponsorship'

const mockForecast = {
  mention: { min: 1000, max: 1500, currency: 'USD' },
  dedicated: { min: 3000, max: 5000, currency: 'USD' },
  series: { min: 8000, max: 12000, currency: 'USD' },
  estimatedCpm: 22.5,
  marketContext: 'Your rates are competitive for your niche.',
}

describe('Sponsorship', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch forecast on mount', async () => {
    const mock = createMockFetch().get('logs', [
      { id: '1', creator_name: 'midudev', type: 'sponsorship_forecast', content: mockForecast, insights: 'Forecast', created_at: '2026-05-20T10:00:00Z' },
    ]).install()
    render(<Sponsorship />)

    await vi.waitFor(() => {
      expect(mock.called('logs')).toBe(true)
    })
  })

  it('should render header and CPM hero', async () => {
    createMockFetch().get('logs', [
      { id: '1', creator_name: 'midudev', type: 'sponsorship_forecast', content: mockForecast, insights: 'Forecast', created_at: '2026-05-20T10:00:00Z' },
    ]).install()
    render(<Sponsorship />)

    expect(screen.getByText('Sponsorship Rates')).toBeInTheDocument()
    expect(screen.getByText('Your CPM')).toBeInTheDocument()

    // CPM value from API (22.5)
    await vi.waitFor(() => {
      expect(screen.getByText('$22.50')).toBeInTheDocument()
    })
  })

  it('should show fallback CPM when API has no forecast', async () => {
    createMockFetch().get('logs', []).install()
    render(<Sponsorship />)

    // Fallback CPM is $18.50
    await vi.waitFor(() => {
      expect(screen.getByText('$18.50')).toBeInTheDocument()
    })
    expect(screen.getByText('Sponsorship Rates')).toBeInTheDocument()
  })

  it('should render page header consistently', async () => {
    createMockFetch().get('logs', [
      { id: '1', creator_name: 'midudev', type: 'sponsorship_forecast', content: mockForecast, insights: 'Forecast', created_at: '2026-05-20T10:00:00Z' },
    ]).install()
    render(<Sponsorship />)

    expect(screen.getByText('Sponsorship Rates')).toBeInTheDocument()
    expect(screen.getByText('AI-powered pricing based on market analysis')).toBeInTheDocument()
  })

  it('should handle network error with fallback', async () => {
    createMockFetch().get('logs', new Error('Network error')).install()
    render(<Sponsorship />)

    // Should show fallback data, not crash
    await vi.waitFor(() => {
      expect(screen.getByText('$18.50')).toBeInTheDocument()
    })
    expect(screen.getByText('Sponsorship Rates')).toBeInTheDocument()
  })
})
