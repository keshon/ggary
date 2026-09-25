// One glyph's rules and its CSS, shared by the build-time compiler and by
// defineIcons at runtime: a glyph an app adds either way is held to the same
// rules as the kit's own, and drawn by the same two lines of CSS.

export const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/

/** A glyph's SVG, checked and collapsed to one line; a glyph that breaks a rule throws, naming it. */
export function checkGlyph(name, svg) {
  if (!NAME.test(name)) throw new Error(`Icon name must be kebab-case: ${name}`)
  const text = String(svg).replace(/\s+/g, ' ').trim()
  if (!/^<svg\b/i.test(text)) throw new Error(`${name}: a glyph is one <svg> element`)
  if (!/viewBox=/.test(text)) throw new Error(`${name}: an icon needs a viewBox, or it cannot scale into its box`)
  if (/<(style|script|image|foreignObject)\b/i.test(text)) {
    throw new Error(`${name}: styles, scripts and embedded images are not allowed in a glyph`)
  }
  return text
}

/** The glyph as a custom property holding a data URI: what a mask draws. */
export const glyphToken = (name, svg) => `--gg-icon-${name}: url("data:image/svg+xml,${encodeURIComponent(svg)}");`

/** The name, mapped to its glyph for anything carrying data-icon. */
export const glyphMapping = (name) => `[data-icon='${name}'] { --gg-icon: var(--gg-icon-${name}); }`
