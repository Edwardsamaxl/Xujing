import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from './Start'
import { renderWithRouter, expectLocation, mockLocalStorage } from '../test/utils'

describe('Start', () => {
  it('renders start screen with title, subtitle and enter button', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await waitFor(() => expect(screen.getByTestId('start-title')).toBeInTheDocument(), {
      timeout: 3000,
    })
    expect(screen.getByText('历史的每一块青砖，都在等待精确的解读。')).toBeInTheDocument()
    expect(screen.getByLabelText('开始探索')).toBeInTheDocument()
  })

  it('navigates to /interest on enter click', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await waitFor(() =>
      expect(screen.getByTestId('start-screen')).toHaveClass('start-screen--content'),
      { timeout: 3000 },
    )

    await userEvent.click(screen.getByLabelText('开始探索'))

    await waitFor(() => expectLocation('/interest'), { timeout: 3000 })
  })
})
