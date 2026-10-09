// Build isolated distributable packages without changing workspace source exports.
import ts from 'typescript'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cache = join(root, 'node_modules/.cache/react-release')
const stage = join(cache, String(Date.now()))
const compiled = join(stage, 'compiled')
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
const roots = ['core', 'react'].flatMap(p => walk(join(root, 'packages', p, 'src')).filter(p => /\.tsx?$/.test(p)))
roots.push(join(root, 'packages/icons/index.ts'), join(root, 'packages/icons/define.ts'), join(root, 'packages/theme-ggarry/dist/index.ts'))
const program = ts.createProgram(roots, {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  declaration: true, strict: true, skipLibCheck: true, rootDir: root,
  outDir: compiled, types: [], verbatimModuleSyntax: true,
})
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }))
  process.exit(1)
}
program.emit()
// Node ESM and declaration imports must resolve without bundler extension guessing.
for (const file of walk(compiled).filter(f => /\.(?:js|ts)$/.test(f))) {
  let source = readFileSync(file, 'utf8')
  source = source.replace(/(from\s*|import\s*\()(['"])(\.[^'"]+)\2/g, (all, prefix, quote, specifier) => {
    if (/\.(?:js|mjs|cjs|json|css)$/i.test(specifier)) return all
    const target = resolve(dirname(file), specifier)
    const resolved = existsSync(target + '.js') ? specifier + '.js'
      : existsSync(join(target, 'index.js')) ? specifier + '/index.js' : null
    if (!resolved) throw new Error(`Unresolved emitted import ${file}: ${specifier}`)
    return prefix + quote + resolved + quote
  })
  writeFileSync(file, source)
}
for (const name of ['core', 'react', 'icons', 'structure', 'theme-ggarry']) {
  const src = join(root, 'packages', name), dest = join(stage, 'packages', name)
  mkdirSync(dest, { recursive: true })
  const manifest = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'))
  delete manifest.scripts
  manifest.files = ['dist', 'src', '*.mjs', 'contract.json']
  if (name === 'core' || name === 'react') {
    cpSync(join(compiled, 'packages', name, 'src'), join(dest, 'dist'), { recursive: true })
    manifest.files = ['dist']
    manifest.exports = {
      '.': { types: './dist/index.d.ts', default: './dist/index.js' },
      './*': { types: './dist/components/*/index.d.ts', default: './dist/components/*/index.js' },
    }
  } else {
    for (const entry of readdirSync(src)) {
      if (entry === 'package.json' || entry === 'node_modules') continue
      cpSync(join(src, entry), join(dest, entry), { recursive: true })
    }
    if (name === 'icons') {
      cpSync(join(compiled, 'packages/icons'), join(dest, 'runtime'), { recursive: true })
      for (const file of readdirSync(src).filter(file => file.startsWith('glyph.'))) cpSync(join(src, file), join(dest, 'runtime', file))
      manifest.files.push('runtime')
      manifest.exports['.'] = { types: './runtime/index.d.ts', default: './runtime/index.js' }
    }
    if (name === 'theme-ggarry') {
      cpSync(join(compiled, 'packages/theme-ggarry/dist'), join(dest, 'dist'), { recursive: true })
      manifest.exports['./tokens'] = { types: './dist/index.d.ts', default: './dist/index.js' }
    }
  }
  writeFileSync(join(dest, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
}
writeFileSync(join(cache, 'latest.json'), JSON.stringify({ stage }))
console.log(`Built React release candidates: ${join(stage, 'packages')}`)
