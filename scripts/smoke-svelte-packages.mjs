import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { stage } = JSON.parse(readFileSync(join(root, 'node_modules/.cache/svelte-release/latest.json'), 'utf8'))
const consumer = mkdtempSync(join(tmpdir(), 'ggary-svelte-consumer-'))
console.log(`Checking installed consumer: ${consumer}`)
const npm = (args, cwd) => {
 const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8' })
 if (result.status !== 0) throw new Error(result.stderr + result.stdout)
 return result.stdout
}
const tarballs = []
for (const name of ['icons', 'core', 'svelte', 'structure', 'theme-ggarry']) {
 const dir = join(stage, 'packages', name)
 const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
 assert.equal(manifest.private, true)
 for (const [dep, version] of Object.entries(manifest.dependencies ?? {})) {
  if (dep.startsWith('@ggary/')) assert.equal(version, JSON.parse(readFileSync(join(stage, 'packages', dep.slice(7), 'package.json'), 'utf8')).version)
 }
 if (name === 'svelte') {
  for (const entry of Object.values(manifest.exports)) for (const target of Object.values(entry)) assert.ok(existsSync(join(dir, target)), target)
 }
 const [packed] = JSON.parse(npm(['pack', '--json', '--pack-destination', consumer], dir))
 if (name === 'svelte') {
  const included = new Set(packed.files.map(file => file.path))
  for (const entry of Object.values(manifest.exports)) for (const target of Object.values(entry)) assert.ok(included.has(target.slice(2)), `Tarball omitted ${target}`)
 }
 tarballs.push(join(consumer, packed.filename))
}
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'ggary-svelte-clean-consumer', private: true, type: 'module' }))
npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', '--workspaces=false', ...tarballs, 'svelte@5', 'vite@6', '@sveltejs/vite-plugin-svelte@5', 'svelte-check@4', 'typescript@5', '@types/node'], consumer)
writeFileSync(join(consumer, 'index.html'), '<div id="app"></div><script type="module" src="/main.ts"></script>')
writeFileSync(join(consumer, 'main.ts'), "import { mount } from 'svelte'; import App from './App.svelte'; mount(App, {target: document.getElementById('app')!});")
writeFileSync(join(consumer, 'App.svelte'), `<script lang="ts">
 import '@ggary/theme-ggarry';
 import { Dialog, TimePicker, Shell } from '@ggary/svelte';
 import { Select } from '@ggary/svelte/select';
 import { DatePicker } from '@ggary/svelte/date-picker';
 import { iconNames } from '@ggary/icons';
 import * as tokens from '@ggary/theme-ggarry/tokens';
 let submitted = $state('none');
 console.log(iconNames.length, Object.keys(tokens).length);
</script>
<form onsubmit={event => {event.preventDefault(); submitted=String(new FormData(event.currentTarget).get('starts'))}}>
 <TimePicker label="Starts" name="starts" defaultValue="14:00" locale="en-GB" />
 <button type="submit">Submit</button><button type="reset">Reset</button>
</form>
<output aria-label="Submitted time">{submitted}</output>
<DatePicker label="Period" locale="en-GB" mode="range" defaultValue={{start:'2026-10-12',end:'2026-10-16'}} />
<Dialog title="Settings">
 {#snippet trigger(attrs)}<button {...attrs}>Open settings</button>{/snippet}
 <Select label="Stage" items={[{value:'new',label:'New'},{value:'done',label:'Done'}]} />
</Dialog>
<Shell collapse="bar">
 {#snippet aside()}<nav aria-label="Consumer navigation"><a href="#work">Work link</a></nav>{/snippet}
 Consumer work
</Shell>`)
writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target:'ES2022', module:'ESNext', moduleResolution:'bundler', strict:true, noEmit:true, skipLibCheck:true, lib:['ES2022','DOM'], types:['node'] }, include:['*.ts','*.svelte'] }))
writeFileSync(join(consumer, 'svelte.config.js'), "import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; export default {preprocess:vitePreprocess()};")
writeFileSync(join(consumer, 'vite.config.js'), "import { defineConfig } from 'vite'; import { svelte } from '@sveltejs/vite-plugin-svelte'; export default defineConfig({plugins:[svelte()],ssr:{noExternal:['@ggary/svelte']}})")
const svelteManifest=JSON.parse(readFileSync(join(stage,'packages/svelte/package.json'),'utf8'))
writeFileSync(join(consumer,'type-tests.ts'), Object.keys(svelteManifest.exports).map((key,index)=>`import * as entry${index} from '${key === '.' ? '@ggary/svelte' : '@ggary/svelte'+key.slice(1)}'; export {entry${index}};`).join('\n') + `
import type { ComponentProps } from 'svelte';
import { TimePicker } from '@ggary/svelte';
// @ts-expect-error generated declarations must reject a nonnumeric step
const invalid: ComponentProps<typeof TimePicker> = { step: 'fifteen' };
`)
console.log(npm(['exec','--','svelte-check','--tsconfig','./tsconfig.json','--fail-on-warnings'],consumer))
console.log(npm(['exec','--','vite','build'],consumer))
writeFileSync(join(consumer, 'entry-server.ts'), "import assert from 'node:assert/strict'; import { render } from 'svelte/server'; import App from './App.svelte'; assert.equal(typeof window,'undefined'); const {body}=render(App); for(const marker of ['14:00','Period','Consumer navigation','Consumer work']) assert.ok(body.includes(marker),marker); console.log('Installed Svelte SSR passed');")
console.log(npm(['exec','--','vite','build','--ssr','entry-server.ts','--outDir','dist-server'],consumer))
const ssr=spawnSync(process.execPath,['dist-server/entry-server.js'],{cwd:consumer,encoding:'utf8'})
if(ssr.status!==0)throw new Error(ssr.stderr+ssr.stdout)
console.log(ssr.stdout.trim())
const require=createRequire(join(consumer,'package.json'))
const {preview}=await import(pathToFileURL(require.resolve('vite')).href)
const server=await preview({root:consumer,preview:{host:'127.0.0.1',port:0,open:false}})
let browser
try {
 browser=await chromium.launch({channel:process.env.GG_BROWSER_CHANNEL ?? 'chrome',headless:true})
 const page=await browser.newPage()
 const errors=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto(server.resolvedUrls.local[0])
 await page.getByRole('combobox',{name:'Starts',exact:true}).fill('16:37')
 await page.keyboard.press('Enter')
 await page.getByRole('button',{name:'Submit',exact:true}).click()
 assert.equal(await page.getByLabel('Submitted time').textContent(),'16:37')
 await page.getByRole('button',{name:'Reset',exact:true}).click()
 assert.equal(await page.getByRole('combobox',{name:'Starts',exact:true}).inputValue(),'14:00')
 await page.getByRole('button',{name:'Open settings',exact:true}).click()
 const stageControl=page.getByRole('combobox',{name:'Stage',exact:true})
 await stageControl.click();await page.getByRole('option',{name:'Done',exact:true}).click()
 assert.ok((await stageControl.textContent()).includes('Done'))
 await stageControl.click();await page.keyboard.press('Escape')
 assert.equal(await page.getByRole('dialog',{name:'Settings'}).isVisible(),true)
 await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Settings'}).waitFor({state:'hidden'})
 const dateTrigger=page.getByRole('button',{name:'Choose dates',exact:true})
 await dateTrigger.click()
 await page.locator('[data-scope=calendar][data-part=day][data-date="2026-10-14"]').click()
 await page.locator('[data-scope=calendar][data-part=day][data-date="2026-10-20"]').click()
 assert.equal(await dateTrigger.getAttribute('aria-expanded'),'false')
 assert.ok((await page.getByRole('textbox',{name:'Period',exact:true}).inputValue()).includes('20 Oct 2026'))
 assert.deepEqual(errors,[])
 await page.screenshot({path:join(stage,'consumer-browser.png'),fullPage:true})
} finally {await browser?.close();await server.httpServer.close()}
writeFileSync(join(stage,'smoke-result.json'),JSON.stringify({consumer,passed:true,checks:['exports','types','vite','ssr','browser']}))
console.log(`Svelte installed consumer passed: ${consumer}`)
