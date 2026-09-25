import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync, mount, unmount, type Component } from 'svelte'
import { PAGES } from '../apps/docs/src/manifest'

/**
 * The docs site: every page in the manifest has a demo in each framework,
 * and the two show the same thing — the same sections, and the same
 * specimens in the same order under the same labels — so a page cannot drift
 * between React and Svelte the way the old sandbox's two copies did.
 */

const reactDemos = import.meta.glob<{ default: ComponentType }>('../apps/docs/src/pages/*/*.tsx')
const svelteDemos = import.meta.glob<{ default: Component }>('../apps/docs/src/pages/*/*.svelte')
const find = <T,>(demos: Record<string, () => Promise<T>>, id: string) => Object.entries(demos).find(([path]) => path.includes(`/pages/${id}/`))?.[1]

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

/** What a page shows: its sections, and each section's specimen labels, in order. */
const outline = (host: Element) =>
  [...host.querySelectorAll('.section')].map((section) => ({
    section: section.querySelector('.section-title')!.textContent,
    specimens: [...section.querySelectorAll('.specimen-label')].map((label) => label.textContent),
  }))

let reactRoot: Root | null = null
let svelteApp: ReturnType<typeof mount> | null = null
afterEach(() => {
  reactRoot?.unmount()
  reactRoot = null
  if (svelteApp) unmount(svelteApp)
  svelteApp = null
  document.body.replaceChildren()
})

describe('docs pages', () => {
  it('every page in the manifest has a demo in each framework, and every demo is in the manifest', () => {
    const ids = PAGES.map((page) => page.id)
    const folders = (demos: Record<string, unknown>) => [...new Set(Object.keys(demos).map((path) => path.split('/pages/')[1].split('/')[0]))].sort()
    expect(ids.filter((id) => !find(reactDemos, id))).toEqual([])
    expect(ids.filter((id) => !find(svelteDemos, id))).toEqual([])
    expect(folders(reactDemos).filter((id) => !ids.includes(id))).toEqual([])
    expect(folders(svelteDemos).filter((id) => !ids.includes(id))).toEqual([])
  })

  it.each(PAGES.map((page) => [page.id]))('%s shows the same specimens in React and in Svelte', async (id) => {
    const reactHost = document.createElement('div')
    const svelteHost = document.createElement('div')
    document.body.append(reactHost, svelteHost)
    const ReactPage = (await find(reactDemos, id)!()).default
    const SveltePage = (await find(svelteDemos, id)!()).default
    reactRoot = createRoot(reactHost)
    reactRoot.render(createElement(ReactPage))
    svelteApp = mount(SveltePage, { target: svelteHost })
    flushSync()
    await frames(3)
    const react = outline(reactHost)
    expect(react.length).toBeGreaterThan(0)
    expect(outline(svelteHost)).toEqual(react)
  })
})
