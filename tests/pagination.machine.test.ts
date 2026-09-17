import { describe, expect, it } from 'vitest'
import { paginationRange } from '../packages/core/src/components/pagination/pagination.connect'

/** The arithmetic of which pages to draw, with no DOM. */
const labels = (items: ReturnType<typeof paginationRange>) => items.map((item) => item.label)

describe('pagination range', () => {
  it('draws every page while they all fit', () => {
    expect(labels(paginationRange({ page: 2, pages: 5 }))).toEqual(['1', '2', '3', '4', '5'])
  })

  it('keeps the ends, the current page and its neighbours, and ellipses the rest', () => {
    expect(labels(paginationRange({ page: 8, pages: 24 }))).toEqual(['1', '…', '7', '8', '9', '…', '24'])
    expect(labels(paginationRange({ page: 8, pages: 24, around: 2 }))).toEqual(['1', '…', '6', '7', '8', '9', '10', '…', '24'])
  })

  it('never ellipses a single page: a gap must stand for more than one', () => {
    // Page 3 of 5 with around 1 leaves 1,2,3,4,5 — no gap anywhere.
    expect(labels(paginationRange({ page: 3, pages: 5 }))).toEqual(['1', '2', '3', '4', '5'])
    // At the edge the gap on the near side would hide page 2 alone, so it is drawn.
    expect(labels(paginationRange({ page: 1, pages: 4 }))).toEqual(['1', '2', '3', '4'])
  })

  it('adds the edges only when they are named, and spends them at the ends', () => {
    const middle = paginationRange({ page: 5, pages: 9, previousLabel: 'Back', nextLabel: 'Forward' })
    expect(labels(middle)[0]).toBe('Back')
    expect(middle[0].disabled).toBeFalsy()
    expect(middle[middle.length - 1].disabled).toBeFalsy()

    const first = paginationRange({ page: 1, pages: 9, previousLabel: 'Back', nextLabel: 'Forward' })
    expect(first[0].disabled).toBe(true)
    expect(first[0].href).toBeUndefined()
    const last = paginationRange({ page: 9, pages: 9, previousLabel: 'Back', nextLabel: 'Forward' })
    expect(last[last.length - 1].disabled).toBe(true)
  })

  it('marks the current page, addresses the rest, and clamps a page out of range', () => {
    const items = paginationRange({ page: 3, pages: 4, href: (page) => `/p/${page}` })
    expect(items.find((item) => item.current)?.label).toBe('3')
    expect(items.map((item) => item.href)).toEqual(['/p/1', '/p/2', '/p/3', '/p/4'])
    expect(paginationRange({ page: 99, pages: 3 }).find((item) => item.current)?.label).toBe('3')
    expect(paginationRange({ page: 0, pages: 3 }).find((item) => item.current)?.label).toBe('1')
  })

  it('a single page is one page', () => {
    expect(labels(paginationRange({ page: 1, pages: 1 }))).toEqual(['1'])
  })
})
