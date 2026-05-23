import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from './Start'
import { renderWithRouter, expectLocation, mockLocalStorage } from '../test/utils'

describe('Start', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('navigates to /interest when no visitorId', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await userEvent.click(screen.getByText('点击启封'))
    vi.advanceTimersByTime(700)

    await waitFor(() => expect(screen.getByText('开启旅程')).toBeInTheDocument())
    await userEvent.click(screen.getByText('开启旅程'))

    await waitFor(() => expectLocation('/interest'))
  })

  it('navigates to /narrative when visitorId exists', async () => {
    mockLocalStorage('v-1')
    renderWithRouter(<Start />)

    await userEvent.click(screen.getByText('点击启封'))
    vi.advanceTimersByTime(700)

    await waitFor(() => expect(screen.getByText('开启旅程')).toBeInTheDocument())
    await userEvent.click(screen.getByText('开启旅程'))

    await waitFor(() => expectLocation('/narrative'))
  })
})
