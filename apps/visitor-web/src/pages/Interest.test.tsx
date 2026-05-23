import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Interest from './Interest'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Interest', () => {
  it('selects a single tag and navigates to /explore after creating session', async () => {
    mockLocalStorage(null)
    const fetchMock = mockFetch({ id: 'v-1' })
    renderWithRouter(<Interest />)

    await userEvent.click(screen.getByText('历史'))

    await userEvent.click(screen.getByText('进入秘辛地图'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/visitor/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ campaignId: 'campaign-palace-001', interestTags: ['历史'] }),
      })
    ))

    await waitFor(() => expectLocation('/explore'))
  })

  it('allows only one tag selection (toggles)', async () => {
    renderWithRouter(<Interest />)

    await userEvent.click(screen.getByText('历史'))
    await userEvent.click(screen.getByText('建筑'))

    // Only the last selected should be active; check via the selected preview
    const preview = screen.getByText('已选偏好').parentElement
    expect(preview).toHaveTextContent('建筑')
    expect(preview).not.toHaveTextContent('历史')
  })

  it('disables start button when no tag selected', async () => {
    renderWithRouter(<Interest />)

    expect(screen.getByText('进入秘辛地图')).toBeDisabled()
  })
})
