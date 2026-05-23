import { render as rtlRender, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { vi, expect } from 'vitest'
import App from '../App'

export function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

interface RenderOptions {
  initialEntries?: string[]
}

export function renderWithRouter(
  ui: ReactNode,
  { initialEntries = ['/'] }: RenderOptions = {}
) {
  return rtlRender(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
      <LocationDisplay />
    </MemoryRouter>
  )
}

export function renderApp(options?: RenderOptions) {
  return renderWithRouter(
    <>
      <App />
    </>,
    options
  )
}

export function expectLocation(path: string) {
  return expect(screen.getByTestId('location').textContent).toBe(path)
}

export function mockFetch(response: any) {
  const mock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
  global.fetch = mock
  return mock
}

export function mockLocalStorage(visitorId: string | null, interestTag?: string) {
  const getItem = vi.fn((key: string) => {
    if (key === 'xujing_visitor_id') return visitorId
    if (key === 'xujing_interest_tags') return interestTag ? JSON.stringify([interestTag]) : null
    if (key === 'xujing_completed_spots') return '[]'
    if (key === 'xujing_unlocked_narratives') return '[]'
    return null
  })
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  })
  return getItem
}
