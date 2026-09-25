import { checkGlyph, glyphMapping, glyphToken } from './glyph.mjs'

const STYLE_ID = 'gg-icons-defined'
const defined = new Map<string, string>()

/**
 * Glyphs added at runtime, for an app with no build step or with icons that
 * arrive late: each is held to the compiler's rules, and all of them live in
 * one stylesheet, rewritten on every call. A name the kit already has is
 * replaced everywhere — the kit's glyphs sit in a cascade layer, these do not,
 * so these win whatever loads first.
 *
 * To name them in TypeScript: `declare module '@ggary/icons' { interface IconRegistry { rocket: true } }`.
 * Where there is no document (a server), the glyphs are checked and kept, and
 * drawn once there is one and defineIcons is called again.
 */
export function defineIcons(glyphs: Record<string, string>): string[] {
  const names = Object.keys(glyphs)
  // All or nothing: every glyph is checked before any is kept, so one bad glyph leaves the rest of the call out too.
  const checked = names.map((name) => [name, checkGlyph(name, glyphs[name])] as const)
  for (const [name, svg] of checked) defined.set(name, svg)
  if (typeof document === 'undefined') return names
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.append(style)
  }
  const entries = [...defined]
  style.textContent = [
    ':root {',
    ...entries.map(([name, svg]) => `  ${glyphToken(name, svg)}`),
    '}',
    ...entries.map(([name]) => glyphMapping(name)),
  ].join('\n')
  return names
}
