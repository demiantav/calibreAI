import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMockFetch } from '@/test-utils'
import Logs from '../Logs'

const mockLogsData = [
  {
    id: '1',
    creator_name: 'midudev',
    type: 'media_kit_update',
    content: { subscribers: 150000 },
    insights: 'Channel metrics updated',
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: '2',
    creator_name: 'midudev',
    type: 'pitch_draft',
    content: { brandName: 'TechBrand' },
    insights: 'New pitch draft created',
    created_at: '2026-05-20T09:30:00Z',
  },
  {
    id: '3',
    creator_name: 'midudev',
    type: 'sponsorship_forecast',
    content: { mention: { min: 1000, max: 1500 } },
    insights: 'Forecast generated',
    created_at: '2026-05-20T09:00:00Z',
  },
  {
    id: '4',
    creator_name: 'midudev',
    type: 'agent_summary',
    content: { text: 'Daily brief' },
    insights: 'Agent summary ready',
    created_at: '2026-05-20T08:00:00Z',
  },
]

describe('Logs', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch logs on mount', async () => {
    const mock = createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(mock.called('logs')).toBe(true)
    })
    expect(mock.callCountFor('logs')).toBe(1)
  })

  it('should render log entries with type labels', async () => {
    createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(screen.getByText('Channel metrics updated')).toBeInTheDocument()
    })
    expect(screen.getByText('New pitch draft created')).toBeInTheDocument()
    expect(screen.getByText('Forecast generated')).toBeInTheDocument()
    expect(screen.getByText('Agent summary ready')).toBeInTheDocument()
  })

  it('should filter logs by type when clicking filter buttons', async () => {
    createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(screen.getByText('Channel metrics updated')).toBeInTheDocument()
    })

    // Click "Pitches" filter
    const pitchesButton = screen.getByRole('button', { name: /Pitches/i })
    fireEvent.click(pitchesButton)

    // Should only show pitch entries
    expect(screen.getByText('New pitch draft created')).toBeInTheDocument()
    expect(screen.queryByText('Channel metrics updated')).not.toBeInTheDocument()
  })

  it('should filter logs by search query', async () => {
    createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(screen.getByText('Channel metrics updated')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search activity…')
    fireEvent.change(searchInput, { target: { value: 'pitch' } })

    expect(screen.getByText('New pitch draft created')).toBeInTheDocument()
    expect(screen.queryByText('Channel metrics updated')).not.toBeInTheDocument()
  })

  it('should show empty state when no logs match filter', async () => {
    createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(screen.getByText('Channel metrics updated')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search activity…')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
  })

  it('should show empty state when API returns empty', async () => {
    createMockFetch().get('logs', []).install()
    render(<Logs />)

    await vi.waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  it('should handle network error gracefully', async () => {
    createMockFetch().get('logs', new Error('Network error')).install()
    render(<Logs />)

    // Should not crash, empty state should appear after loading finishes
    await vi.waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  it('should show loading skeleton while fetching', async () => {
    createMockFetch().get('logs', mockLogsData).install()
    render(<Logs />)

    // Initially loading state should be present
    const loadingSkeletons = document.querySelectorAll('.animate-pulse')
    expect(loadingSkeletons.length).toBeGreaterThan(0)
  })
})
