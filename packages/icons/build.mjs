// The default glyph set. Every name here is one core may put in data-icon.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileIcons } from './compile.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const names = compileIcons({
  srcDir: join(root, 'svg'),
  outCss: join(root, 'dist/icons.css'),
  outTs: join(root, 'dist/names.ts'),
  mapping: true,
})
console.log(`icons: ${names.length} glyphs (${names.join(', ')}) -> dist/`)
