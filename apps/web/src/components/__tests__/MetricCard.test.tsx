import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from '@/components/MetricCard'
import { Users, TrendingUp } from 'lucide-react'

describe('MetricCard', () => {
  it('should render label and formatted value', () => {
    render(<MetricCard label="Followers" value={150000} />)
    expect(screen.getByText('Followers')).toBeInTheDocument()
    expect(screen.getByText('150,000')).toBeInTheDocument()
  })

  it('should render positive trend with success color', () => {
    render(<MetricCard label="Growth" value={12} trend={15} />)
    expect(screen.getByText('+15%')).toBeInTheDocument()
    const trendEl = screen.getByText('+15%')
    expect(trendEl.className).toContain('text-success')
  })

  it('should render negative trend with red color', () => {
    render(<MetricCard label="Drop" value={5} trend={-8} />)
    expect(screen.getByText('-8%')).toBeInTheDocument()
    const trendEl = screen.getByText('-8%')
    expect(trendEl.className).toContain('text-red-500')
  })

  it('should render icon when provided', () => {
    render(<MetricCard label="Users" value={1000} icon={Users} />)
    expect(screen.getByText('Users')).toBeInTheDocument()
    // Icon is rendered as SVG inside the card
    const icon = document.querySelector('.lucide-users')
    expect(icon).toBeInTheDocument()
  })

  it('should render prefix and suffix', () => {
    render(<MetricCard label="Revenue" value={5000} prefix="$" suffix="/mo" />)
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeInTheDocument()
    expect(screen.getByText('/mo')).toBeInTheDocument()
  })

  it('should apply accent styles when accent is true', () => {
    const { container } = render(
      <MetricCard label="Hero" value={999} icon={TrendingUp} accent />
    )
    // Tailwind v4 class with slash — query via attribute selector to avoid CSS parse error
    const card = container.querySelector('[class*="border-accent"]')
    expect(card).toBeInTheDocument()
  })

  it('should not show trend when not provided', () => {
    render(<MetricCard label="Plain" value={42} />)
    const trendElements = screen.queryAllByText(/%/)
    expect(trendElements.length).toBe(0)
  })
})
