import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SendPitchModal from '../SendPitchModal'
import type { PitchDraft } from '@/lib/types'

const mockPitch: PitchDraft = {
  brandName: 'TechBrand',
  brandEmail: 'partner@techbrand.com',
  status: 'draft_ready',
  pitchSubject: 'Propuesta: TechBrand x Creador',
  pitchContent: 'Hola, gracias por contactarnos...',
  originalEmailFrom: '"Tech" <partner@techbrand.com>',
  originalEmailSubject: 'Colaboración',
  originalEmailSnippet: 'Queremos trabajar contigo',
  gmailId: 'abc123',
}

const defaultProps = {
  pitch: mockPitch,
  pitchId: 'pitch-1',
  onClose: vi.fn(),
  onSent: vi.fn(),
}

describe('SendPitchModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should render brand name and email', () => {
    render(<SendPitchModal {...defaultProps} />)
    expect(screen.getByText(/TechBrand$/)).toBeInTheDocument()
    expect(screen.getByText('partner@techbrand.com')).toBeInTheDocument()
  })

  it('should render subject and content from pitch data', () => {
    render(<SendPitchModal {...defaultProps} />)
    const subjectInput = screen.getByDisplayValue('Propuesta: TechBrand x Creador')
    expect(subjectInput).toBeInTheDocument()

    const contentArea = screen.getByDisplayValue('Hola, gracias por contactarnos...')
    expect(contentArea).toBeInTheDocument()
  })

  it('should toggle edit mode when Edit button is clicked', async () => {
    const user = userEvent.setup()
    render(<SendPitchModal {...defaultProps} />)

    const subjectInput = screen.getByDisplayValue('Propuesta: TechBrand x Creador')
    expect(subjectInput).toHaveAttribute('readOnly')

    const editBtn = screen.getByText('Edit')
    await user.click(editBtn)

    expect(screen.getByText('Done Editing'))
  })

  it('should call fetch POST with correct data when Send is clicked', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchFn)

    const user = userEvent.setup()
    render(<SendPitchModal {...defaultProps} />)

    const sendBtn = screen.getByText('Send')
    await user.click(sendBtn)

    expect(fetchFn).toHaveBeenCalledWith('http://localhost:8080/api/pitches/pitch-1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Propuesta: TechBrand x Creador',
        content: 'Hola, gracias por contactarnos...',
      }),
    })
  })

  it('should toggle original email accordion', async () => {
    const user = userEvent.setup()
    render(<SendPitchModal {...defaultProps} />)

    expect(screen.queryByText('Colaboración')).not.toBeInTheDocument()

    const toggleBtn = screen.getByText('Original Email')
    await user.click(toggleBtn)

    expect(screen.getByText('Colaboración')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<SendPitchModal {...defaultProps} onClose={onClose} />)

    const xBtn = screen.getByRole('button', { name: /close/i })
    if (xBtn) {
      await user.click(xBtn)
    }

    // Also clicking overlay should close
    expect(onClose).toHaveBeenCalled()
  })
})
