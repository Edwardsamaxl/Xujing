import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Start from './Start'
import { renderWithRouter, mockLocalStorage } from '../test/utils'

describe('Start', () => {
  it('renders gate phase with title and knocker hint', async () => {
    mockLocalStorage(null)
    renderWithRouter(<Start />)

    await waitFor(() => expect(screen.getByText('叙境')).toBeInTheDocument())
    expect(screen.getByText('故宫密档寻踪')).toBeInTheDocument()
    expect(screen.getByText('向下拖拽开启宫门')).toBeInTheDocument()
  })
})
