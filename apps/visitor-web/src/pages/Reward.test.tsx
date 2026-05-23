import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Reward from './Reward'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Reward', () => {
  it('redirects to / when no visitorId', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Reward />, { initialEntries: ['/reward'] })

    await waitFor(() => expectLocation('/'))
  })

  it('navigates to /narrative when more tasks remain', async () => {
    mockLocalStorage('v-1')
    mockFetch({
      name: '钟表馆密档',
      unlockText: '你发现了隐藏线索',
      imageUrl: null,
      taskIndex: 1,
      totalTasks: 3,
      spotId: 'spot-clock',
    })

    renderWithRouter(<Reward />, { initialEntries: ['/reward'] })

    await waitFor(() => expect(screen.getByText('勘验成功')).toBeInTheDocument())
    await userEvent.click(screen.getByText('继续探索'))

    await waitFor(() => expectLocation('/narrative'))
  })

  it('navigates to /complete when all tasks done', async () => {
    mockLocalStorage('v-1')
    mockFetch({
      name: '钟表馆密档',
      unlockText: '你发现了隐藏线索',
      imageUrl: null,
      taskIndex: 2,
      totalTasks: 3,
      spotId: 'spot-clock',
    })

    renderWithRouter(<Reward />, { initialEntries: ['/reward'] })

    await waitFor(() => expect(screen.getByText('勘验成功')).toBeInTheDocument())
    await userEvent.click(screen.getByText('查看纪念册'))

    await waitFor(() => expectLocation('/complete'))
  })
})
