import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox, Fieldset, Switch } from '../packages/react/src/index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

for (const name of ['Checkbox', 'Switch'] as const) {
  describe(`${name} form-input ref and disabled fieldset`, () => {
    it('keeps its input ref and lets Fieldset disable visible activation', async () => {
      const host = document.createElement('div')
      document.body.append(host)
      const root = createRoot(host)
      let input: HTMLInputElement | null = null
      const ref = (element: HTMLInputElement | null) => { input = element }
      const onCheckedChange = vi.fn()
      const render = (disabled: boolean) => createElement(Fieldset, { disabled, children:
        name === 'Checkbox'
          ? createElement(Checkbox, { ref, name: 'choice', onCheckedChange, children: 'Option' })
          : createElement(Switch, { ref, name: 'choice', onCheckedChange, children: 'Option' }),
      })
      try {
        await act(async () => root.render(render(true)))
        const native = input!
        const toggle = host.querySelector<HTMLElement>('[data-part="toggle"]')!
        expect(native.tagName).toBe('INPUT')
        expect(toggle.getAttribute('aria-disabled')).toBe('true')
        expect(toggle.tabIndex).toBe(-1)
        await act(async () => toggle.click())
        expect(onCheckedChange).not.toHaveBeenCalled()
        await act(async () => root.render(render(false)))
        expect(input).toBe(native)
        expect(toggle.getAttribute('aria-disabled')).not.toBe('true')
        expect(toggle.tabIndex).toBe(0)
        await act(async () => native.focus())
        expect(document.activeElement).toBe(toggle)
        await act(async () => toggle.click())
        expect(onCheckedChange).toHaveBeenCalledExactlyOnceWith(true)
        expect(native.checked).toBe(true)
      } finally {
        await act(async () => root.unmount())
        host.remove()
      }
    })
  })
}
