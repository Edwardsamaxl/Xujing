import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Interest from './Interest'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Interest', () => {
  it('selects tags and navigates to /narrative after creating session', async () => {
    mockLocalStorage(null)
    const fetchMock = mockFetch({ id: 'v-1' })
    renderWithRouter(<Interest />)

    await userEvent.click(screen.getByText('历史'))
    await userEvent.click(screen.getByText('建筑'))

    await userEvent.click(screen.getByText('生成密档'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/visitor/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ campaignId: 'demo', interestTags: ['历史', '建筑'] }),
      })
    ))

    await waitFor(() => expectLocation('/narrative'))
  })

  it('does not allow more than 2 tags', async () => {
    renderWithRouter(<Interest />)

    await userEvent.click(screen.getByText('历史'))
    await userEvent.click(screen.getByText('建筑'))
    await userEvent.click(screen.getByText('人物'))

    expect(screen.getByText('人物').closest('button')).not.toHaveClass('border-cinnabar')
  })

  it('disables start button when no tag selected', async () => {
    renderWithRouter(<Interest />)

    expect(screen.getByText('生成密档')).toBeDisabled()
  })
})
