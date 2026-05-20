import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PulseButton } from '../PulseButton'

describe('PulseButton', () => {
  it('should render Sparkles icon in idle state', () => {
    render(<PulseButton onPulse={() => {}} status="idle" />)
    expect(document.querySelector('.lucide-sparkles')).toBeInTheDocument()
  })

  it('should call onPulse when clicked in idle state', async () => {
    const onPulse = vi.fn()
    const user = userEvent.setup()
    render(<PulseButton onPulse={onPulse} status="idle" />)

    const btn = screen.getByRole('button')
    await user.click(btn)

    expect(onPulse).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onPulse when clicked in pulsing state', async () => {
    const onPulse = vi.fn()
    const user = userEvent.setup()
    render(<PulseButton onPulse={onPulse} status="pulsing" />)

    const btn = screen.getByRole('button')
    await user.click(btn)

    expect(onPulse).not.toHaveBeenCalled()
  })

  it('should NOT call onPulse when clicked in success state', async () => {
    const onPulse = vi.fn()
    const user = userEvent.setup()
    render(<PulseButton onPulse={onPulse} status="success" />)

    const btn = screen.getByRole('button')
    await user.click(btn)

    expect(onPulse).not.toHaveBeenCalled()
  })

  it('should NOT call onPulse when clicked in error state', async () => {
    const onPulse = vi.fn()
    const user = userEvent.setup()
    render(<PulseButton onPulse={onPulse} status="error" />)

    const btn = screen.getByRole('button')
    await user.click(btn)

    expect(onPulse).not.toHaveBeenCalled()
  })

  it('should render Check icon in success state', () => {
    render(<PulseButton onPulse={() => {}} status="success" />)
    expect(document.querySelector('.lucide-check')).toBeInTheDocument()
  })

  it('should render X icon in error state', () => {
    render(<PulseButton onPulse={() => {}} status="error" />)
    expect(document.querySelector('.lucide-x')).toBeInTheDocument()
  })
})
