import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Button, Field, Form, FormSummary, Input } from '../packages/react/src/index'

/**
 * A form where only a browser can say: the real keyboard submitting and
 * walking the summary, a valid form going on to its action as plain HTML
 * does, a rule that asks a server before it lets the form go, and a second
 * press while the first submission is out.
 */

let root: Root | null = null
afterEach(() => {
  root?.unmount()
  root = null
  document.body.replaceChildren()
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Watches the page's own submit, after the form's: whether the browser would have gone on to the action. */
function watchNative() {
  const passed: boolean[] = []
  const listen = (event: Event) => {
    passed.push(!event.defaultPrevented)
    // The test page must not navigate.
    event.preventDefault()
  }
  window.addEventListener('submit', listen)
  return { passed, stop: () => window.removeEventListener('submit', listen) }
}

async function mount(props: Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  root.render(
    h(
      Form,
      { action: '/signup', method: 'post', ...props },
      h(FormSummary, null),
      h(Field as never, { name: 'email', label: 'Email' }, h(Input, { type: 'email', name: 'email', required: true })),
      h(Button, { type: 'submit' }, 'Create account')
    )
  )
  await wait(50)
  const input = host.querySelector<HTMLInputElement>('input[name="email"]')!
  const summary = host.querySelector<HTMLElement>('[data-scope="form-summary"]')!
  return { host, input, summary }
}

describe('form', () => {
  it('the real keyboard submits; the summary takes the focus, Tab reaches its link, Enter goes to the field', async () => {
    const native = watchNative()
    const { input, summary } = await mount({})
    input.focus()
    await userEvent.keyboard('{Enter}')
    await wait(60)
    expect(document.activeElement).toBe(summary)
    expect(native.passed).toEqual([false])
    await userEvent.keyboard('{Tab}')
    expect(document.activeElement?.getAttribute('data-part')).toBe('link')
    await userEvent.keyboard('{Enter}')
    expect(document.activeElement).toBe(input)
    native.stop()
  })

  it('a valid form without onSubmit goes on to its action, as plain HTML does', async () => {
    const native = watchNative()
    const { input, host } = await mount({})
    await userEvent.type(input, 'aigul@example.com')
    await userEvent.click(host.querySelector('button[type="submit"]')!)
    await wait(30)
    expect(native.passed).toEqual([true])
    native.stop()
  })

  it('a rule that asks a server holds the form until it answers, then lets it go', async () => {
    const native = watchNative()
    const taken = new Set(['aigul@example.com'])
    const validate = async (data: FormData) => {
      await wait(30)
      return { email: taken.has(String(data.get('email'))) ? 'That address is taken' : null }
    }
    const { input, host } = await mount({ validate })
    await userEvent.type(input, 'aigul@example.com')
    await userEvent.click(host.querySelector('button[type="submit"]')!)
    await wait(120)
    expect(native.passed).toEqual([false])
    expect(host.querySelector('[data-scope="field"][data-part="error"]:not([hidden])')!.textContent).toBe('That address is taken')
    await userEvent.clear(input)
    await userEvent.type(input, 'aigul.s@example.com')
    await userEvent.click(host.querySelector('button[type="submit"]')!)
    await wait(120)
    // Held once for the answer, then submitted to its action.
    expect(native.passed).toEqual([false, false, true])
    native.stop()
  })

  it('a second press while the first submission is out sends nothing more', async () => {
    const sent: string[] = []
    let finish: () => void = () => {}
    const onSubmit = (data: FormData) => {
      sent.push(String(data.get('email')))
      return new Promise<void>((resolve) => (finish = resolve))
    }
    const { input, host } = await mount({ onSubmit })
    await userEvent.type(input, 'aigul@example.com')
    const button = host.querySelector<HTMLElement>('button[type="submit"]')!
    await userEvent.click(button)
    await wait(20)
    expect(host.querySelector('form')!.getAttribute('aria-busy')).toBe('true')
    await userEvent.click(button)
    await wait(20)
    expect(sent).toEqual(['aigul@example.com'])
    finish()
    await wait(20)
    expect(host.querySelector('form')!.hasAttribute('aria-busy')).toBe(false)
  })
})
