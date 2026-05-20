import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockInsert = vi.hoisted(() => vi.fn(() => Promise.resolve({ error: null })))
const mockMaybeSingle = vi.hoisted(() => vi.fn(() => Promise.resolve({ data: null, error: null })))
const mockLimit = vi.hoisted(() => vi.fn(() => ({ maybeSingle: mockMaybeSingle })))
const mockOrder = vi.hoisted(() => vi.fn(() => ({ limit: mockLimit })))
const mockEq2 = vi.hoisted(() => vi.fn(() => ({ order: mockOrder })))
const mockEq1 = vi.hoisted(() => vi.fn(() => ({ eq: mockEq2 })))
const mockSelect = vi.hoisted(() => vi.fn(() => ({ eq: mockEq1 })))

vi.mock('../../../../infrastructure/supabase/supabase-client.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  },
}))

// Make model.generateContent throw so mock fallback is used
vi.mock('../../../agent-core/reasoning/gemini-client.js', () => ({
  model: {
    generateContent: vi.fn(() => { throw new Error('Gemini not available') }),
  },
}))

// ─── SUT ────────────────────────────────────────────────────────────────────────

import { generatePitchUseCase } from '../generate-pitch.js'

const baseInput = {
  creatorName: 'midudev',
  brandName: 'TechBrand',
  brandEmail: 'partner@techbrand.com',
  brandContext: 'Queremos colaborar con vos para promocionar nuestro nuevo IDE',
  originalEmailFrom: '"TechBrand" <partner@techbrand.com>',
  originalEmailSubject: 'Propuesta de colaboración: TechBrand x midudev',
  originalEmailSnippet: 'Hola, nos encantaría trabajar contigo...',
  gmailId: 'abc123',
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('generatePitchUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mock fallback (Gemini unavailable)', () => {
    it('should generate mock pitch subject with brand x creator format', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.pitchSubject).toBe('Propuesta de colaboración: TechBrand x midudev')
    })

    it('should include brand name and creator name in mock pitch content', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.pitchContent).toContain('TechBrand')
      expect(result.pitchContent).toContain('midudev')
    })
  })

  describe('BrandDeal entity creation', () => {
    it('should create draft with status draft_ready', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.draft.status).toBe('draft_ready')
    })

    it('should set brandName and brandEmail correctly', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.draft.brandName).toBe('TechBrand')
      expect(result.draft.brandEmail).toBe('partner@techbrand.com')
    })

    it('should pass through original email fields to draft', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.draft.gmailId).toBe('abc123')
      expect(result.draft.originalEmailFrom).toBe('"TechBrand" <partner@techbrand.com>')
      expect(result.draft.originalEmailSubject).toBe('Propuesta de colaboración: TechBrand x midudev')
      expect(result.draft.originalEmailSnippet).toBe('Hola, nos encantaría trabajar contigo...')
    })

    it('should set detectedAt as ISO string', async () => {
      const result = await generatePitchUseCase(baseInput)
      expect(result.draft.detectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should fall back to brandContext for sourceEmailSubject when no originalEmailSubject', async () => {
      const result = await generatePitchUseCase({
        creatorName: 'midudev',
        brandName: 'Brand',
        brandEmail: 'brand@test.com',
        brandContext: 'Hello from brand',
      })
      expect(result.draft.sourceEmailSubject).toBe('Hello from brand')
    })
  })

  describe('persistence', () => {
    it('should persist to agent_logs with type pitch_draft', async () => {
      await generatePitchUseCase(baseInput)

      expect(mockInsert).toHaveBeenCalled()
      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].type).toBe('pitch_draft')
      expect(insertArg[0].creator_name).toBe('midudev')
    })

    it('should set correct insights based on pitch style', async () => {
      await generatePitchUseCase({
        ...baseInput,
        pitchStyle: 'casual',
      })

      const insertArg = mockInsert.mock.calls[0][0] as any[]
      expect(insertArg[0].insights).toContain('casual')
    })
  })

  describe('supabase media kit query', () => {
    it('should query media_kit_update for the creator', async () => {
      await generatePitchUseCase(baseInput)

      expect(mockSelect).toHaveBeenCalledWith('content, insights')
      expect(mockEq1).toHaveBeenCalledWith('creator_name', 'midudev')
      expect(mockEq2).toHaveBeenCalledWith('type', 'media_kit_update')
    })
  })
})
