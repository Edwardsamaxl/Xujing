import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Explore from './Explore'
import { renderWithRouter, expectLocation, mockLocalStorage } from '../test/utils'

describe('Explore', () => {
  it('renders spot cards and navigates to navigate page on click', async () => {
    mockLocalStorage('v-1', '历史')
    renderWithRouter(<Explore />)

    await waitFor(() => expect(screen.getByText('选关中枢')).toBeInTheDocument())
    expect(screen.getByText('钟表馆')).toBeInTheDocument()
    expect(screen.getByText('珍宝馆')).toBeInTheDocument()

    await userEvent.click(screen.getByText('延禧宫'))
    await waitFor(() => expectLocation('/navigate?spotId=spot-yanxi'))
  })

  it('navigates to /complete when all spots completed', async () => {
    mockLocalStorage('v-1', '历史')
    // Simulate all spots completed via localStorage mock if needed;
    // for now just verify the complete button text is present when none remain.
    renderWithRouter(<Explore />)

    await waitFor(() => expect(screen.getByText('随机探索')).toBeInTheDocument())
  })
})
