import { defineIcons } from '@ggary/icons'

/**
 * Two glyphs an app brings, on the kit's 16px grid: defined once as the page
 * loads, and named in TypeScript the way an app names its own.
 */
declare module '@ggary/icons' {
  interface IconRegistry {
    rocket: true
    planet: true
  }
}

const glyph = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

export const appGlyphs = defineIcons({
  rocket: glyph('<path d="M8 1.75c2.2 1.6 3.25 3.9 3.25 6.5v3.5h-6.5v-3.5c0-2.6 1.05-4.9 3.25-6.5z"/><path d="M4.75 9.5 2.75 12v1.25h2M11.25 9.5l2 2.5v1.25h-2M7 14.25h2"/><circle cx="8" cy="6.5" r="1.1"/>'),
  planet: glyph('<circle cx="8" cy="8" r="3.75"/><path d="M4.4 10.9c-1.9 1.3-2.8 2.5-2.4 3.1.8 1.1 4.6-.4 8.3-3.1s6.1-5.8 5.3-6.9c-.4-.6-1.8-.3-3.6.7"/>'),
})

/** The glyphs each size is shown with. */
export const sampleGlyphs = ['star', 'bell', 'settings'] as const
