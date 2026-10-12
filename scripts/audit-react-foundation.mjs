import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'vite'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const components = join(root, 'packages/react/src/components')
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
const native = new Set(['button', 'button-group', 'segmented-control', 'link', 'copyable', 'pagination', 'nav', 'breadcrumbs', 'upload'])
const domain = new Set(['tree', 'data-grid', 'kanban', 'gantt', 'date-picker', 'time-picker', 'cascader', 'command-palette', 'form', 'layout', 'ribbon', 'anchor', 'file-drop', 'log', 'composer', 'choice-card', 'chip-group', 'share', 'panel', 'config-provider'])
const inventory = readdirSync(components, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
  const sources = walk(join(components, e.name)).filter(f => /\.tsx?$/.test(f)).map(f => readFileSync(f, 'utf8')).join('\n')
  const primitives = [...new Set([...sources.matchAll(/from ['"]@base-ui\/react\/([^'"]+)['"]/g)].map(m => m[1]))].sort()
  const internalComponents = [...new Set([...sources.matchAll(/from ['"]\.\.\/([^/'"]+)(?:\/[^'"]*)?['"]/g)].map(m => m[1]))].filter(n => n !== 'utils').sort()
  return {
    directory: e.name, primitives, internalComponents,
    decision: primitives.length ? 'Base UI adapter or composite; retain GGary API and domain extensions'
      : domain.has(e.name) ? 'Retain GGary domain behavior; inspect internal components for foundation composition'
      : native.has(e.name) ? 'Retain native browser semantics with GGary presentation/integration'
      : 'Retain GGary presentation or small utility; no blanket primitive migration',
    verification: 'Ownership inventory only; not an accessibility certification',
  }
})
writeFileSync(join(root, 'packages/react/component-inventory.json'), JSON.stringify(inventory, null, 2) + '\n')
const output = join(root, 'node_modules/.cache/foundation-audit')
mkdirSync(output, { recursive: true })
const css = []
for (const [name, file] of [['theme', 'packages/theme-ggarry/src/index.css'], ['structure', 'packages/structure/src/index.css'], ['icons', 'packages/icons/dist/icons.css']]) {
  const result = await build({ root, configFile: false, logLevel: 'silent', build: { write: false, cssMinify: true, rollupOptions: { input: join(root, file) } } })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output).filter(o => o.type === 'asset' && o.fileName.endsWith('.css'))
  const bytes = Buffer.concat(outputs.map(o => Buffer.from(o.source)))
  css.push({ entry: name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length })
}
const report = { directories: inventory.length, directBaseUI: inventory.filter(e => e.primitives.length).length, css }
writeFileSync(join(output, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
