import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AgentIndicator } from '@/components/AgentIndicator'
import { MemoryRouter } from 'react-router-dom'

describe('AgentIndicator', () => {
  it('should render "AI Agent Active" text', () => {
    render(
      <MemoryRouter>
        <AgentIndicator />
      </MemoryRouter>
    )
    expect(screen.getByText('AI Agent Active')).toBeInTheDocument()
  })

  it('should render counts with default zero values', () => {
    render(
      <MemoryRouter>
        <AgentIndicator />
      </MemoryRouter>
    )
    expect(screen.getByText('0 logs · 0 pitches')).toBeInTheDocument()
  })

  it('should render provided counts', () => {
    render(
      <MemoryRouter>
        <AgentIndicator logsCount={42} pitchCount={7} />
      </MemoryRouter>
    )
    expect(screen.getByText('42 logs · 7 pitches')).toBeInTheDocument()
  })

  it('should link to /logs page', () => {
    render(
      <MemoryRouter>
        <AgentIndicator logsCount={5} pitchCount={2} />
      </MemoryRouter>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/logs')
  })
})
