import { describe, expect, it } from 'vitest'
import { defineIcons } from '../packages/icons/index'

/**
 * Glyphs added at runtime: one stylesheet for all of them, rewritten on every
 * call, each glyph held to the compiler's rules — and a name the kit already
 * has replaced by the app's.
 */

const svg = (body: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000">${body}</svg>`
const sheet = () => document.getElementById('gg-icons-defined') as HTMLStyleElement | null

describe('defineIcons', () => {
  it('writes each glyph as a token and maps its name, in one stylesheet', () => {
    expect(defineIcons({ rocket: svg('<path d="M8 2v12"/>') })).toEqual(['rocket'])
    const css = sheet()!.textContent!
    expect(css).toContain('--gg-icon-rocket: url("data:image/svg+xml,')
    expect(css).toContain("[data-icon='rocket'] { --gg-icon: var(--gg-icon-rocket); }")
    expect(document.querySelectorAll('#gg-icons-defined')).toHaveLength(1)
  })

  it('keeps what it defined before, and a name defined again takes its new glyph', () => {
    defineIcons({ planet: svg('<circle cx="8" cy="8" r="4"/>') })
    defineIcons({ rocket: svg('<path d="M2 8h12"/>') })
    const css = sheet()!.textContent!
    expect(css).toContain('--gg-icon-planet:')
    expect(css).toContain(encodeURIComponent('<path d="M2 8h12"/>'))
    expect(css).not.toContain(encodeURIComponent('<path d="M8 2v12"/>'))
    expect(document.querySelectorAll('#gg-icons-defined')).toHaveLength(1)
  })

  it('may replace one of the kit’s own glyphs by its name', () => {
    defineIcons({ check: svg('<path d="M3 8h10"/>') })
    expect(sheet()!.textContent).toContain("[data-icon='check'] { --gg-icon: var(--gg-icon-check); }")
  })

  it('refuses a glyph the compiler would refuse, and adds nothing', () => {
    const before = sheet()!.textContent
    expect(() => defineIcons({ broken: '<svg><path d="M0 0"/></svg>' })).toThrow(/viewBox/)
    expect(() => defineIcons({ sneaky: svg('<script>alert(1)</script>') })).toThrow(/not allowed/)
    expect(() => defineIcons({ Bad_Name: svg('<path d="M0 0h1"/>') })).toThrow(/kebab-case/)
    expect(sheet()!.textContent).toBe(before)
    // A call with one bad glyph keeps none of its good ones either.
    expect(() => defineIcons({ comet: svg('<path d="M2 2l12 12"/>'), broken: '<svg/>' })).toThrow()
    defineIcons({ moon: svg('<circle cx="8" cy="8" r="5"/>') })
    expect(sheet()!.textContent).not.toContain('--gg-icon-comet')
  })
})
