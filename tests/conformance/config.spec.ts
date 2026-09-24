import { describe, expect, it } from 'vitest'
import { type Adapter, freshTarget, part, parts } from './harness'

/**
 * ConfigProvider: one element with no box carrying the language, direction
 * and mode it sets; under it, every control takes its size, every component
 * that writes a time or a word takes its locale and words — unless the
 * component says otherwise; a provider inside it changes only what it sets;
 * and a change reaches everything under it without a remount.
 */
export function configConformance(adapter: Adapter) {
  describe('config provider', () => {
    const setup = async (config: object = {}, inner: object = {}) => {
      const m = await adapter.configProvider({ config, inner }, freshTarget())
      const provider = () => parts(m.root, 'config-provider', 'root')[0]
      const button = (text: string) => parts(m.root, 'button', 'root').find((each) => each.textContent?.trim() === text)!
      const time = () => part(m.root, 'time-picker', 'input') as HTMLInputElement
      const more = () => part(m.root, 'list', 'more')!
      return { m, provider, button, time, more }
    }

    it('its element carries the language, direction and mode it sets, and nothing else', async () => {
      const { provider } = await setup({ locale: 'ar-EG', dir: 'rtl', mode: 'dark' })
      expect([provider().getAttribute('lang'), provider().getAttribute('dir'), provider().dataset.mode]).toEqual(['ar-EG', 'rtl', 'dark'])
      const bare = await setup()
      expect(['lang', 'dir', 'data-mode'].map((name) => bare.provider().hasAttribute(name))).toEqual([false, false, false])
      expect(bare.m.root.querySelector('[class]')).toBeNull()
    })

    it('sizes every control under it, unless the control says its own; an inner provider changes only what it sets', async () => {
      const { m, button } = await setup({ size: 'sm' }, { size: 'lg' })
      expect(button('Save').dataset.size).toBe('sm')
      expect(part(m.root, 'input', 'root')!.dataset.size).toBe('sm')
      expect(button('Own').dataset.size).toBe('lg')
      expect(button('Inner').dataset.size).toBe('lg')
    })

    it('writes times in its locale, and words in its words, laid under the component’s own', async () => {
      const { time, more } = await setup({ locale: 'en-US', words: { list: { more: 'Load more files' } } })
      expect(time().value).toMatch(/^2:30\sPM$/)
      expect(more().textContent).toBe('Load more files')
      const russian = await setup({ locale: 'ru-RU' })
      expect(russian.time().value).toBe('14:30')
    })

    it('a change reaches everything under it without a remount', async () => {
      const { m, button, time, more } = await setup({ size: 'sm', locale: 'en-US' })
      const before = button('Save')
      await m.update({ config: { size: 'lg', locale: 'en-GB', words: { list: { more: 'More' } } } })
      expect(button('Save')).toBe(before)
      expect(button('Save').dataset.size).toBe('lg')
      expect(time().value).toBe('14:30')
      expect(more().textContent).toBe('More')
    })
  })
}
