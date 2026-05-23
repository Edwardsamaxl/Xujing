import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Complete from './Complete'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Complete', () => {
  it('redirects to / when no visitorId', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Complete />, { initialEntries: ['/complete'] })

    await waitFor(() => expectLocation('/'))
  })

  it('displays summary and navigates to / on restart', async () => {
    mockLocalStorage('v-1')
    mockFetch({
      spots: [
        { name: '奉先殿·钟表馆', id: 'spot-clock' },
        { name: '宁寿宫·珍宝馆', id: 'spot-treasure' },
      ],
      rewards: [{ name: '钟表馆密档' }],
    })

    renderWithRouter(<Complete />, { initialEntries: ['/complete'] })

    await waitFor(() => expect(screen.getByText('密档寻踪 · 已结案')).toBeInTheDocument())
    expect(screen.getAllByText('奉先殿·钟表馆').length).toBeGreaterThanOrEqual(1)

    await userEvent.click(screen.getByText('再探一次'))

    await waitFor(() => expectLocation('/'))
  })
})
