import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Centralized framer-motion mock — used by all components
// Each motion element is explicitly mapped to its HTML/SVG equivalent
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    aside: ({ children, ...props }: any) => <aside {...props}>{children}</aside>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
    rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
    defs: ({ children, ...props }: any) => <defs {...props}>{children}</defs>,
    linearGradient: ({ children, ...props }: any) => <linearGradient {...props}>{children}</linearGradient>,
    stop: ({ children, ...props }: any) => <stop {...props}>{children}</stop>,
    line: ({ children, ...props }: any) => <line {...props}>{children}</line>,
    text: ({ children, ...props }: any) => <text {...props}>{children}</text>,
    link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ set: () => {} }),
  useTransform: () => '',
  useSpring: () => '',
}))

// Mock useCountUp to return value immediately (no animation in tests)
vi.mock('@/lib/use-count-up', () => ({
  useCountUp: (value: number) => value,
}))

// Mock AuthContext for components that use useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      youtube_channel_id: 'UC8LeXCWOalN8SxlrPcG-PaQ',
      youtube_channel_name: 'Test Creator',
      onboarding_completed: true,
      onboarding_step: 4,
      auto_pitch_enabled: false,
      email_digest_enabled: false,
    },
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    updateUser: vi.fn(),
  }),
}))



// Mock localStorage for jsdom compatibility (ThemeProvider calls window.localStorage)
const store: Record<string, string> = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[key]) },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  writable: true,
  configurable: true,
})
