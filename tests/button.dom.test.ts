import { beforeAll, describe, expect, it } from 'vitest'

/**
 * The Button contract every theme's button.css is written against. Button has
 * no machine, so this is the whole of what core promises about it.
 */

beforeAll(async () => {
  await import('../packages/elements/src/index')
})

const render = (attrs: string) => {
  document.body.innerHTML = `<gg-button ${attrs}><button>Go</button></gg-button>`
  return document.querySelector('button')!
}

describe('intent attributes', () => {
  it('defaults to medium emphasis and emits no tone for neutral', () => {
    const button = render('')
    expect(button.dataset.emphasis).toBe('medium')
    expect(button.hasAttribute('data-tone')).toBe(false)
  })

  it('emits emphasis and tone as data attributes', () => {
    const button = render('emphasis="high" tone="danger"')
    expect(button.dataset.emphasis).toBe('high')
    expect(button.dataset.tone).toBe('danger')
  })

  // The API is named by intent so that a theme which forbids a LOOK can still
  // honour every value. A look-named attribute would be a lie in some theme.
  it('never emits a look-named variant', () => {
    const button = render('emphasis="low"')
    expect(button.hasAttribute('data-variant')).toBe(false)
  })

  it('reacts to attribute changes on the enhancer', () => {
    const button = render('emphasis="low"')
    button.parentElement!.setAttribute('emphasis', 'minimal')
    expect(button.dataset.emphasis).toBe('minimal')
  })
})

describe('busy is not disabled', () => {
  // Disabling a busy button drops it out of the tab order under the fingers of
  // whoever pressed it from the keyboard. The first scaffold did exactly that.
  it('keeps a loading button enabled and focusable', () => {
    const button = render('loading')
    expect(button.disabled).toBe(false)
    expect(button.hasAttribute('data-disabled')).toBe(false)
    button.focus()
    expect(document.activeElement).toBe(button)
  })

  it('announces busy through aria-busy and data-loading', () => {
    const button = render('loading')
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('data-loading')).toBe(true)
  })

  it('still renders the spinner part, so a theme can choose whether to draw it', () => {
    const button = render('loading')
    expect(button.querySelector('[data-scope="button"][data-part="spinner"]')).toBeTruthy()
  })

  it('disables only when asked to', () => {
    const button = render('disabled')
    expect(button.disabled).toBe(true)
    expect(button.hasAttribute('data-disabled')).toBe(true)
  })
})
