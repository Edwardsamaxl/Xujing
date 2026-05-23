import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Start from './Start'
import { renderWithRouter, expectLocation, mockLocalStorage } from '../test/utils'

describe('Start', () => {
  it('renders entry screen with title and enter button', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await waitFor(() => expect(screen.getByText('叙境')).toBeInTheDocument())
    expect(screen.getByText('故宫密档寻踪')).toBeInTheDocument()
    expect(screen.getByText('尘光入殿，旧档将启')).toBeInTheDocument()
    expect(screen.getByLabelText('进入')).toBeInTheDocument()
  })

  it('navigates to /interest on enter click', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await waitFor(() => expect(screen.getByLabelText('进入')).toBeInTheDocument())
    await userEvent.click(screen.getByLabelText('进入'))

    await waitFor(() => expectLocation('/interest'))
  })
})
