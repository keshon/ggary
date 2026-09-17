import { afterEach, describe, expect, it } from 'vitest'
import { attachAutosize } from '../packages/core/src/utils/autosize'
import { connect } from '../packages/core/src/components/textarea/textarea.connect'
import { domNormalizer, reactNormalizer, svelteNormalizer } from '../packages/core/src/normalize-props'

/**
 * jsdom has no layout, so the textarea is given the one measurement autosize
 * reads: a scrollHeight that behaves like a browser's — the content's lines,
 * never less than the collapsed box (rows), plus padding.
 */
const LINE = 20
const PADDING = 8 // top + bottom
const BORDER = 2 // top + bottom

function textarea({ rows = 2, boxSizing = 'border-box' } = {}) {
  const el = document.createElement('textarea')
  el.rows = rows
  el.style.cssText = `line-height:${LINE}px;padding:4px 0;border:1px solid;box-sizing:${boxSizing}`
  Object.defineProperty(el, 'scrollHeight', {
    // Read from the element's own line-height, so a test can change the metrics.
    get: () => Math.max(el.value.split('\n').length, el.rows) * parseFloat(el.style.lineHeight) + PADDING,
  })
  document.body.append(el)
  return el
}

const type = (el: HTMLTextAreaElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n')

afterEach(() => document.body.replaceChildren())

describe('attachAutosize', () => {
  it('rests at its rows, border and padding included for border-box', () => {
    const el = textarea({ rows: 3 })
    attachAutosize(el)
    expect(el.style.height).toBe(`${3 * LINE + PADDING + BORDER}px`)
    expect(el.style.overflowY).toBe('hidden')
  })

  it('grows with typing and shrinks back when text is deleted', () => {
    const el = textarea({ rows: 2 })
    attachAutosize(el)
    type(el, lines(6))
    expect(el.style.height).toBe(`${6 * LINE + PADDING + BORDER}px`)
    type(el, 'short')
    expect(el.style.height).toBe(`${2 * LINE + PADDING + BORDER}px`)
  })

  it('stops at maxRows and scrolls from there', () => {
    const el = textarea({ rows: 2 })
    attachAutosize(el, { maxRows: 4 })
    type(el, lines(10))
    expect(el.style.height).toBe(`${4 * LINE + PADDING + BORDER}px`)
    expect(el.style.overflowY).toBe('auto')
    type(el, lines(3))
    expect(el.style.overflowY).toBe('hidden')
  })

  it('measures content-box without padding and border', () => {
    const el = textarea({ rows: 2, boxSizing: 'content-box' })
    attachAutosize(el)
    expect(el.style.height).toBe(`${2 * LINE}px`)
  })

  it('re-measures on update(), for values set from code', () => {
    const el = textarea({ rows: 2 })
    const autosize = attachAutosize(el)
    el.value = lines(5)
    autosize.update()
    expect(el.style.height).toBe(`${5 * LINE + PADDING + BORDER}px`)
  })

  it('takes new options, and leaves no inline styles or listeners behind', () => {
    const el = textarea({ rows: 2 })
    const autosize = attachAutosize(el)
    type(el, lines(8))
    autosize.setOptions({ maxRows: 3 })
    expect(el.style.height).toBe(`${3 * LINE + PADDING + BORDER}px`)

    autosize.destroy()
    expect(el.style.height).toBe('')
    expect(el.style.overflowY).toBe('')
    type(el, lines(2))
    expect(el.style.height).toBe('')
  })
})

describe('attachAutosize — the page changes under it', () => {
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

  afterEach(() => {
    document.documentElement.removeAttribute('data-mode')
    document.head.querySelectorAll('style[data-test]').forEach((style) => style.remove())
  })

  it('re-measures when the root element changes attributes — a theme, mode or density switch', async () => {
    const el = textarea({ rows: 2 })
    attachAutosize(el)
    type(el, lines(5))
    el.style.lineHeight = '30px' // what the new theme's CSS would do

    document.documentElement.setAttribute('data-mode', 'dark')
    await settle()
    expect(el.style.height).toBe(`${5 * 30 + PADDING + BORDER}px`)
  })

  it('re-measures when a stylesheet is added or swapped', async () => {
    const el = textarea({ rows: 2 })
    attachAutosize(el)
    type(el, lines(3))
    el.style.lineHeight = '40px'

    const style = document.createElement('style')
    style.dataset.test = ''
    document.head.append(style)
    await settle()
    expect(el.style.height).toBe(`${3 * 40 + PADDING + BORDER}px`)
  })

  it('stops watching once destroyed', async () => {
    const el = textarea({ rows: 2 })
    attachAutosize(el).destroy()
    el.style.height = '7px'
    document.documentElement.setAttribute('data-mode', 'dark')
    await settle()
    expect(el.style.height).toBe('7px')
  })
})

describe('textarea connect', () => {
  it('turns the resize handle off when auto-resizing, and says how to autosize', () => {
    const plain = connect({}, (p) => p)
    expect(plain.rootProps['data-resize']).toBe('vertical')
    expect(plain.autosize).toBeNull()

    const auto = connect({ autoResize: true, maxRows: 8, resize: 'vertical' }, (p) => p)
    expect(auto.rootProps['data-resize']).toBe('none')
    expect(auto.rootProps['data-autoresize']).toBe('')
    expect(auto.autosize).toEqual({ maxRows: 8 })
  })

  it('names length limits as each framework expects them', () => {
    const props = { minLength: 2, maxLength: 280 }
    expect(connect(props, reactNormalizer).rootProps).toMatchObject({ minLength: 2, maxLength: 280 })
    expect(connect(props, svelteNormalizer).rootProps).toMatchObject({ minlength: 2, maxlength: 280 })
    expect(connect(props, domNormalizer).rootProps.attrs).toMatchObject({ minlength: '2', maxlength: '280' })
  })
})
