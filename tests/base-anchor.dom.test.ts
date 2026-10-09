import { afterEach, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Anchor } from '../packages/react/src/components/anchor/Anchor'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined
  document.body.replaceChildren()
})
it('opening a sibling Anchor does not steal focus back into the dismissed popup', async () => {
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  const items = [{ label: 'Section', href: '#section' }]
  await act(async () => {
    root!.render(h('div', null, h(Anchor, { label: 'First', items, float: true }),
      h(Anchor, { label: 'Second', items, float: true, defaultOpen: true })))
    await settle()
  })
  const triggers = host.querySelectorAll<HTMLButtonElement>('[data-part=trigger]')
  await act(async () => {
    triggers[0].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
    triggers[0].focus(); triggers[0].click(); await settle()
  })
  expect(triggers[0].getAttribute('aria-expanded')).toBe('true')
  expect(triggers[1].getAttribute('aria-expanded')).toBe('false')
  const link = host.querySelector<HTMLElement>('[data-part=panel]:not([hidden]) a')!
  await act(async () => {
    link.focus(); link.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle()
  })
  expect(triggers[0].getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(triggers[0])
})
