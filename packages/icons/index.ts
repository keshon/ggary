import type { KitIconName } from './dist/names'

export { iconNames } from './dist/names'
export type { KitIconName }
export { defineIcons } from './define'

/**
 * An app's own glyphs, by name. `compileIcons({ app: true })` writes the
 * augmentation for the glyphs it compiles; for ones added with `defineIcons`,
 * write it by hand:
 *
 *   declare module '@ggary/icons' { interface IconRegistry { rocket: true } }
 */
export interface IconRegistry {}

/** A glyph's name: one of the kit's, or one the app has registered. */
export type IconName = KitIconName | Extract<keyof IconRegistry, string>
