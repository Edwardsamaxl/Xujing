import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckIn from './CheckIn'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('CheckIn', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('redirects to /narrative when no spotId', async () => {
    mockLocalStorage('v-1')
    renderWithRouter(<CheckIn />, { initialEntries: ['/check-in'] })

    await waitFor(() => expectLocation('/narrative'))
  })

  it('navigates to /reward when rewardUnlocked', async () => {
    mockLocalStorage('v-1')
    mockFetch({ success: true, checkInId: 'ci-1', rewardUnlocked: true, completed: true })

    renderWithRouter(<CheckIn />, { initialEntries: ['/check-in?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('勘验打卡')).toBeInTheDocument())
    await userEvent.click(screen.getByText('勘验打卡'))

    vi.advanceTimersByTime(900)
    await waitFor(() => expectLocation('/reward'))
  })

  it('navigates to /complete when completed', async () => {
    mockLocalStorage('v-1')
    mockFetch({ success: true, checkInId: 'ci-1', rewardUnlocked: false, completed: true })

    renderWithRouter(<CheckIn />, { initialEntries: ['/check-in?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('勘验打卡')).toBeInTheDocument())
    await userEvent.click(screen.getByText('勘验打卡'))

    vi.advanceTimersByTime(900)
    await waitFor(() => expectLocation('/complete'))
  })

  it('navigates to /narrative for next task', async () => {
    mockLocalStorage('v-1')
    mockFetch({ success: true, checkInId: 'ci-1', rewardUnlocked: false, completed: false })

    renderWithRouter(<CheckIn />, { initialEntries: ['/check-in?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('勘验打卡')).toBeInTheDocument())
    await userEvent.click(screen.getByText('勘验打卡'))

    vi.advanceTimersByTime(900)
    await waitFor(() => expectLocation('/narrative'))
  })

  it('navigates back to /narrative when clicking 我还没到', async () => {
    mockLocalStorage('v-1')
    renderWithRouter(<CheckIn />, { initialEntries: ['/check-in?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('我还没到')).toBeInTheDocument())
    await userEvent.click(screen.getByText('我还没到'))

    await waitFor(() => expectLocation('/narrative'))
  })
})
