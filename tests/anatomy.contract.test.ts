import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, it } from 'vitest'

/**
 * Rule 1 of the contract, for every node an adapter draws: it carries a part,
 * because it takes a prop bag from core. A bare <span> is a node no theme can
 * name except by its tag, and a stylesheet that reaches for `> span` breaks the
 * day the markup changes. Checked on the adapters' source, not on a mounted
 * DOM: there a component's nodes and the ones its owner passed in look alike.
 */

const root = join(__dirname, '..')

const HTML = new Set(
  ('a abbr article aside b button caption code col colgroup dd del details dialog div dl dt em fieldset figcaption figure ' +
    'footer form h1 h2 h3 h4 h5 h6 header hr i img input ins kbd label legend li main mark menu meter nav ol optgroup option ' +
    'output p pre progress s section select small span strong sub summary sup table tbody td textarea tfoot th thead time tr u ul ' +
    'svg path circle rect line polyline polygon g text tspan').split(' ')
)

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? sources(path) : /\.(tsx|svelte)$/.test(name) ? [path] : []
  })

/** Comments and a Svelte file's script out, line breaks kept so a finding names its line. */
const markupOf = (path: string, text: string) =>
  (path.endsWith('.svelte') ? text.replace(/<script[\s\S]*?<\/script>/g, (m) => m.replace(/[^\n]/g, ' ')) : text)
    .replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, lead) => lead + ' '.repeat(m.length - lead.length))

/** The attributes of the tag opened at `start`, read to its closing `>` with braces and quotes balanced. */
function attributesAt(text: string, start: number): string {
  let depth = 0
  let quote: string | null = null
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === quote) quote = null
      continue
    }
    if (depth > 0 && (c === '"' || c === "'" || c === '`')) quote = c
    else if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) return text.slice(start, i)
  }
  return text.slice(start)
}

it('every element an adapter draws takes a prop bag from core', () => {
  const bare: string[] = []
  for (const adapter of ['react', 'svelte']) {
    for (const path of sources(join(root, 'packages', adapter, 'src', 'components'))) {
      const text = markupOf(path, readFileSync(path, 'utf8'))
      for (const m of text.matchAll(/<([a-z][a-z0-9]*)(?=[\s/>])/g)) {
        if (!HTML.has(m[1])) continue
        const attrs = attributesAt(text, m.index + m[0].length)
        if (/\{\s*\.\.\./.test(attrs) || /data-(scope|part)=/.test(attrs)) continue
        const line = text.slice(0, m.index).split('\n').length
        bare.push(`${relative(root, path).replace(/\\/g, '/')}:${line} <${m[1]}${attrs.replace(/\s+/g, ' ').slice(0, 50)}>`)
      }
    }
  }
  expect(bare).toEqual([])
})

it('no adapter emits a class: themes style parts and states, never class names', () => {
  const classed: string[] = []
  for (const adapter of ['react', 'svelte']) {
    for (const path of sources(join(root, 'packages', adapter, 'src', 'components'))) {
      const text = markupOf(path, readFileSync(path, 'utf8'))
      for (const m of text.matchAll(/\s(class|className)(=|:)/g)) {
        classed.push(`${relative(root, path).replace(/\\/g, '/')}:${text.slice(0, m.index).split('\n').length}`)
      }
    }
  }
  expect(classed).toEqual([])
})
