import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { checkConsumerBrowser } from './smoke-react-browser.mjs'
import { fileURLToPath } from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { stage } = JSON.parse(readFileSync(join(root, 'node_modules/.cache/react-release/latest.json'), 'utf8'))
const consumer = mkdtempSync(join(tmpdir(), 'ggary-consumer-'))
const npm = (args, cwd) => {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr + result.stdout)
  return result.stdout
}
const tarballs = []
for (const name of ['icons', 'core', 'react', 'structure', 'theme-ggarry']) {
  const manifest = JSON.parse(readFileSync(join(stage, 'packages', name, 'package.json'), 'utf8'))
  assert.equal(manifest.private, true, `${name}: candidates must remain private`)
  for (const [dependency, version] of Object.entries(manifest.dependencies ?? {})) {
    if (dependency.startsWith('@ggary/')) {
      const sibling = JSON.parse(readFileSync(join(stage, 'packages', dependency.slice(7), 'package.json'), 'utf8'))
      assert.equal(version, sibling.version, `${name}: sibling version mismatch`)
    }
  }
  const result = JSON.parse(npm(['pack', '--json', '--pack-destination', consumer], join(stage, 'packages', name)))
  tarballs.push(join(consumer, result[0].filename))
}
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'ggary-clean-consumer', private: true, type: 'module' }))
npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--workspaces=false', ...tarballs, 'react@19', 'react-dom@19', 'vite@6', 'typescript@5', '@types/react@19', '@types/react-dom@19'], consumer)
writeFileSync(join(consumer, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>')
writeFileSync(join(consumer, 'main.tsx'), `import '@ggary/theme-ggarry';
import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Field, Input, Toolbar, ToolbarButton, createToaster, Dialog, Form, FormSummary, Button, Menubar } from '@ggary/react';
import { Select } from '@ggary/react/select';
import { iconNames } from '@ggary/icons';
import * as tokens from '@ggary/theme-ggarry/tokens';
const queue = createToaster(); queue.toast({ title: 'Ready' });
console.log(iconNames, tokens);
function App() {
 const [submitted, setSubmitted] = useState('none');
 return h('div', null,
 h(Form, { onSubmit: data => { setSubmitted(String(data.get('name'))); }, children: [
  h(FormSummary, { key: 'summary' }),
  h(Field, { key: 'field', name: 'name', label: 'Name', children: h(Input, { required: true }) }),
  h(Button, { key: 'submit', type: 'submit' }, 'Submit'),
  h(Button, { key: 'reset', type: 'reset' }, 'Reset'),
 ] }),
 h('output', { 'aria-label': 'Submitted name' }, submitted),
 h(Dialog, { title: 'Settings', trigger: props => h(Button, props, 'Open settings'), children:
  h(Select, { label: 'Stage', items: [{ label: 'New', value: 'new' }, { label: 'Done', value: 'done' }] }) }),
 h(Menubar, { label: 'Application', mnemonics: true, menus: [{ value: 'edit', label: '&Edit', items: [{ value: 'undo', label: 'Undo edit' }, { value: 'redo', label: 'Redo edit' }] }] }),
 h(Toolbar, { label: 'Actions', children: [h(ToolbarButton, { key: 'save' }, 'Save'), h(ToolbarButton, { key: 'undo' }, 'Undo')] }));
}
createRoot(document.getElementById('root')!).render(h(App));
`)
writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
  target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx',
  strict: true, noEmit: true, skipLibCheck: true, lib: ['ES2022', 'DOM'],
}, include: ['main.tsx'] }))
console.log(npm(['exec', '--', 'tsc', '-p', 'tsconfig.json'], consumer))
console.log(npm(['exec', '--', 'vite', 'build'], consumer))
const esm = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('@ggary/react'); await import('@ggary/react/select'); await import('@ggary/core'); await import('@ggary/icons'); await import('@ggary/theme-ggarry/tokens');"], { cwd: consumer, encoding: 'utf8' })
if (esm.status !== 0) throw new Error(esm.stderr + esm.stdout)
await checkConsumerBrowser(consumer, stage)
writeFileSync(join(stage, 'smoke-result.json'), JSON.stringify({ consumer, passed: true, checks: ['types', 'vite', 'node-esm', 'browser'] }))
console.log(`Clean consumer passed types, Vite build, Node ESM imports and browser interactions: ${consumer}`)
