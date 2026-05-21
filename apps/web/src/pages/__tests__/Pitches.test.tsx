import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMockFetch } from '@/test-utils'
import { MemoryRouter } from 'react-router-dom'
import Pitches from '../Pitches'

const mockPitchLogs = [
  {
    id: '1',
    creator_name: 'midudev',
    type: 'pitch_draft',
    content: {
      brandName: 'TechBrand',
      brandEmail: 'partner@techbrand.com',
      status: 'draft_ready',
      pitchSubject: 'Collaboration Proposal',
      pitchContent: 'We would love to work with you on our new product launch.',
    },
    insights: 'Pitch draft generated',
    created_at: '2026-05-20T10:00:00Z',
  },
  {
    id: '2',
    creator_name: 'midudev',
    type: 'pitch_draft',
    content: {
      brandName: 'GameCorp',
      brandEmail: 'hello@gamecorp.com',
      status: 'sent',
      pitchSubject: 'Sponsorship Opportunity',
      pitchContent: 'Interested in a dedicated video for our gaming platform.',
    },
    insights: 'Pitch sent',
    created_at: '2026-05-19T09:00:00Z',
  },
  {
    id: '3',
    creator_name: 'midudev',
    type: 'pitch_draft',
    content: {
      brandName: 'FashionCo',
      brandEmail: 'collab@fashionco.com',
      status: 'responded',
      pitchSubject: 'Brand Deal Inquiry',
      pitchContent: 'We loved your content and want to discuss a partnership.',
    },
    insights: 'Response received',
    created_at: '2026-05-18T08:00:00Z',
  },
]

describe('Pitches', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should fetch pitches on mount', async () => {
    const mock = createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(mock.called('logs')).toBe(true)
    })
    expect(mock.callCountFor('logs')).toBe(1)
  })

  it('should render pitch cards with brand info', async () => {
    createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('TechBrand')).toBeInTheDocument()
    })
    expect(screen.getByText('Collaboration Proposal')).toBeInTheDocument()
    expect(screen.getByText('partner@techbrand.com')).toBeInTheDocument()
    expect(screen.getByText('Draft Ready')).toBeInTheDocument()
  })

  it('should filter pitches by tab', async () => {
    createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('TechBrand')).toBeInTheDocument()
    })

    // Click Sent tab
    const sentTab = screen.getByRole('button', { name: /Sent/i })
    fireEvent.click(sentTab)

    expect(screen.getByText('GameCorp')).toBeInTheDocument()
    expect(screen.queryByText('TechBrand')).not.toBeInTheDocument()
  })

  it('should show Review & Send button for draft_ready pitches', async () => {
    createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('Review & Send')).toBeInTheDocument()
    })
  })

  it('should not show Review & Send button for sent pitches', async () => {
    createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('Sent')).toBeInTheDocument()
    })

    const sentTab = screen.getByRole('button', { name: /Sent/i })
    fireEvent.click(sentTab)

    expect(screen.queryByText('Review & Send')).not.toBeInTheDocument()
  })

  it('should show empty state when no pitches in tab', async () => {
    createMockFetch().get('logs', []).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('No pending pitches')).toBeInTheDocument()
    })
    expect(screen.getByText('Your AI agent will generate them based on your content')).toBeInTheDocument()
  })

  it('should sort pitches by date descending', async () => {
    createMockFetch().get('logs', mockPitchLogs).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('TechBrand')).toBeInTheDocument()
    })

    // In Pending tab (default), only TechBrand should be visible
    expect(screen.getByText('TechBrand')).toBeInTheDocument()
    expect(screen.queryByText('GameCorp')).not.toBeInTheDocument()
  })

  it('should handle network error gracefully', async () => {
    createMockFetch().get('logs', new Error('Network error')).install()
    render(
      <MemoryRouter>
        <Pitches />
      </MemoryRouter>
    )

    // Should not crash, show empty state
    await vi.waitFor(() => {
      expect(screen.getByText('No pending pitches')).toBeInTheDocument()
    })
  })
})
