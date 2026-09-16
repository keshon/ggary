// Instrument's glyphs, drawn on its own grid and stroke. Only tokens are emitted:
// an override can reshape a glyph but cannot add a name core does not know
// (tests/icons.contract.test.ts checks that every name here exists in the base).
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileIcons } from '@ggary/icons/compile'

const root = dirname(fileURLToPath(import.meta.url))
const names = compileIcons({
  srcDir: join(root, 'icons'),
  outCss: join(root, 'dist/icons.css'),
  banner: "Instrument's glyph overrides.",
})
console.log(`instrument icons: ${names.length} overrides (${names.join(', ')}) -> dist/`)
