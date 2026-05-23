import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Narrative from './Narrative'
import { renderWithRouter, expectLocation, mockFetch, mockLocalStorage } from '../test/utils'

describe('Narrative', () => {
  it('redirects to / when no visitorId', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Narrative />, { initialEntries: ['/narrative?spotId=spot-clock'] })

    await waitFor(() => expectLocation('/'))
  })

  it('renders narrative content for the spot and interest tag', async () => {
    mockLocalStorage('v-1', '历史')
    mockFetch({ narrativeTitle: '钟表馆', narrativeText: '测试叙事内容' })
    renderWithRouter(<Narrative />, { initialEntries: ['/narrative?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByRole('heading', { name: '钟表馆' })).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('测试叙事内容')).toBeInTheDocument())
  })

  it('navigates to navigate page on next spot button', async () => {
    mockLocalStorage('v-1', '历史')
    renderWithRouter(<Narrative />, { initialEntries: ['/narrative?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('去下一个地点')).toBeInTheDocument())
    await userEvent.click(screen.getByText('去下一个地点'))

    // From spot-clock, nearest unexplored is spot-yanxi (200m)
    await waitFor(() => expectLocation('/navigate?spotId=spot-yanxi'))
  })

  it('opens archive modal when clicking 密档', async () => {
    mockLocalStorage('v-1', '历史')
    renderWithRouter(<Narrative />, { initialEntries: ['/narrative?spotId=spot-clock'] })

    await waitFor(() => expect(screen.getByText('密档')).toBeInTheDocument())
    await userEvent.click(screen.getByText('密档'))

    expect(screen.getByText('秘辛收藏册')).toBeInTheDocument()
  })
})
