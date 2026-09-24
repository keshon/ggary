import { describe, expect, it } from 'vitest'
import { type Adapter, type FormProps, click, freshTarget, part, parts, typeInto } from './harness'

/**
 * A form in each framework: a submit that finds errors — the browser's, the
 * rules', the server's — stopped, each field saying why, the summary listing
 * them as links and taking the focus, errors leaving as they are fixed, and a
 * valid form handed to the owner.
 */
export function formConformance(adapter: Adapter) {
  const run = describe
  run('form', () => {
    const rules = (data: FormData) => ({
      confirm: data.get('confirm') !== data.get('password') ? 'The passwords differ' : null,
      role: data.get('role') ? null : 'Choose a role',
    })

    const setup = async (props: Partial<FormProps> = {}) => {
      const sent: Record<string, string>[] = []
      const m = await adapter.form({ validate: rules, onSubmit: (data) => void sent.push(Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]))), ...props }, freshTarget())
      const form = () => m.root.querySelector('form') ?? (m.root as HTMLFormElement)
      const input = (name: string) => form().querySelector<HTMLInputElement>(`input[name="${name}"]:not([type="hidden"])`)!
      const summary = () => part(m.root, 'form-summary', 'root')
      const links = () => parts(m.root, 'form-summary', 'link').map((link) => link.textContent)
      const fieldError = (name: string) => {
        const control = name === 'role' ? m.root.querySelector<HTMLElement>('[data-scope="select"][data-part="trigger"]')! : input(name)
        return (control.getAttribute('aria-describedby') ?? '')
          .split(' ')
          .map((id) => document.getElementById(id))
          .find((element) => element && !element.hidden && /error/.test(element.getAttribute('data-part') ?? ''))?.textContent
      }
      const submit = async () => {
        await adapter.act(() => click(m.root.querySelector<HTMLElement>('button[type="submit"]')!))
        await adapter.wait(20)
      }
      const type = async (name: string, text: string) => {
        await adapter.act(() => typeInto(input(name), text))
        await adapter.wait(20)
      }
      const chooseRole = async (label: string) => {
        await adapter.act(() => click(m.root.querySelector<HTMLElement>('[data-scope="select"][data-part="trigger"]')!))
        await adapter.wait(0)
        const option = parts(m.root, 'select', 'item').find((item) => item.textContent?.includes(label))!
        await adapter.act(() => click(option))
        await adapter.wait(20)
      }
      return { m, form, input, summary, links, fieldError, submit, type, chooseRole, sent }
    }

    it('a submit with errors is stopped: each field says why, the summary lists them in page order and takes the focus', async () => {
      const { form, summary, links, fieldError, submit, sent } = await setup()
      expect(form().noValidate).toBe(true)
      expect(summary()!.hidden).toBe(true)
      await submit()
      expect(sent).toEqual([])
      expect(summary()!.hidden).toBe(false)
      expect(document.activeElement).toBe(summary())
      expect(document.getElementById(summary()!.getAttribute('aria-labelledby')!)!.textContent).toBe('There is a problem')
      const listed = links()
      expect(listed.map((text) => text!.split(':')[0])).toEqual(['Email', 'Password', 'Role'])
      expect(listed[2]).toBe('Role: Choose a role')
      expect(fieldError('role')).toBe('Choose a role')
      expect(fieldError('email')).toBeTruthy()
      const trigger = document.querySelector('[data-scope="select"][data-part="trigger"]')!
      expect(trigger.getAttribute('aria-invalid')).toBe('true')
    })

    it('a link in the summary takes the focus to its field', async () => {
      const { m, input, submit } = await setup()
      await submit()
      await adapter.act(() => click(parts(m.root, 'form-summary', 'link')[1]))
      expect(document.activeElement).toBe(input('password'))
    })

    it('errors leave as they are fixed, the rules asked again as the person edits', async () => {
      const { links, fieldError, submit, type, chooseRole } = await setup()
      await submit()
      await type('email', 'aigul@example.com')
      expect(links().map((text) => text!.split(':')[0])).toEqual(['Password', 'Role'])
      await type('password', 'long enough')
      await type('confirm', 'long enougz')
      expect(fieldError('confirm')).toBe('The passwords differ')
      await type('confirm', 'long enough')
      expect(fieldError('confirm')).toBeUndefined()
      await chooseRole('Member')
      expect(fieldError('role')).toBeUndefined()
      expect(links()).toEqual([])
    })

    it('a valid form goes to onSubmit with its data; the server’s errors come back to their fields', async () => {
      const answers: unknown[] = [{ errors: { email: 'That address is taken' }, message: 'The account was not created.' }, undefined]
      const sent: string[] = []
      const { m, summary, fieldError, submit, type, chooseRole } = await setup({
        onSubmit: (data) => {
          sent.push(String(data.get('email')))
          return answers.shift()
        },
      })
      await type('email', 'aigul@example.com')
      await type('password', 'long enough')
      await type('confirm', 'long enough')
      await chooseRole('Admin')
      await submit()
      expect(sent).toEqual(['aigul@example.com'])
      expect(fieldError('email')).toBe('That address is taken')
      expect(part(m.root, 'form-summary', 'message')!.textContent).toBe('The account was not created.')
      expect(document.activeElement).toBe(summary())
      await type('email', 'aigul.s@example.com')
      expect(fieldError('email')).toBeUndefined()
      await submit()
      expect(sent).toEqual(['aigul@example.com', 'aigul.s@example.com'])
      expect(summary()!.hidden).toBe(true)
    })

    it('without a summary, a failed submit takes the focus to the first field in error', async () => {
      const { input, submit, type } = await setup({ summary: false })
      await type('email', 'aigul@example.com')
      await submit()
      expect(document.activeElement).toBe(input('password'))
    })
  })
}
