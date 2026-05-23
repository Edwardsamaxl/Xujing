import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Narrative from './Narrative'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Narrative', () => {
  it('redirects to / when no visitorId', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Narrative />, { initialEntries: ['/narrative'] })

    await waitFor(() => expectLocation('/'))
  })

  it('loads task and navigates to check-in on button click', async () => {
    mockLocalStorage('v-1')
    mockFetch({
      currentSpotName: '故宫',
      narrativeTitle: '测试标题',
      narrativeText: '测试文本',
      destinationHint: '奉先殿·钟表馆',
      nextSpotId: 'spot-clock',
      nextSpotName: '奉先殿',
      taskIndex: 0,
      totalTasks: 3,
    })

    renderWithRouter(<Narrative />, { initialEntries: ['/narrative'] })

    await waitFor(() => expect(screen.getByText('测试标题')).toBeInTheDocument())
    expect(screen.getByText('测试文本')).toBeInTheDocument()
    expect(screen.getByText('奉先殿·钟表馆')).toBeInTheDocument()

    await userEvent.click(screen.getByText('前往奉先殿勘验'))

    await waitFor(() => expectLocation('/check-in?spotId=spot-clock'))
  })
})
