import { describe, expect, it } from 'vitest'
import { applyConfig, configWords, connect, resolveConfig } from '../packages/core/src/components/config-provider'
import type { Dict } from '../packages/core/src/types'

/**
 * The provider's arithmetic, without a DOM: a provider inside another
 * changing only what it sets, words merged a component and a key at a time,
 * and a component's props filled only where it left them out, and only with
 * what it takes.
 */

const same = (props: Dict) => props

describe('config', () => {
  it('an inner provider changes only what it sets', () => {
    const outer = { locale: 'ru-RU', size: 'sm' as const, words: { upload: { retry: 'Повторить', waiting: 'Ждёт' } } }
    const inner = resolveConfig(outer, { size: 'lg', words: { upload: { retry: 'Ещё раз' }, list: { more: 'Ещё' } } })
    expect(inner.locale).toBe('ru-RU')
    expect(inner.size).toBe('lg')
    expect(inner.words).toEqual({ upload: { retry: 'Ещё раз', waiting: 'Ждёт' }, list: { more: 'Ещё' } })
    expect(outer.words.upload.retry).toBe('Повторить')
  })

  it('fills only what a component left out, and only what it takes', () => {
    const config = { locale: 'ru-RU', size: 'sm' as const, words: { list: { more: 'Ещё', loading: 'Загрузка…' } } }
    const props = { title: 'Files', words: { more: 'Show 12 more' } }
    const filled = applyConfig(props, config, { words: 'list' })
    expect(filled).toEqual({ title: 'Files', words: { more: 'Show 12 more', loading: 'Загрузка…' } })
    expect('size' in filled).toBe(false)
    expect('locale' in filled).toBe(false)
    expect(applyConfig({ size: 'lg' }, config, { size: true })).toEqual({ size: 'lg' })
    expect(applyConfig({}, config, { size: true, locale: true })).toEqual({ size: 'sm', locale: 'ru-RU' })
  })

  it('hands a component back its own props when there is nothing to fill', () => {
    const props = { size: 'md' }
    expect(applyConfig(props, {}, { size: true, locale: true, words: 'upload' })).toBe(props)
  })

  it('lays a component’s own words over the provider’s', () => {
    const config = { words: { upload: { retry: 'Повторить', waiting: 'Ждёт' } } }
    expect(configWords(config, 'upload', { retry: 'Again' })).toEqual({ retry: 'Again', waiting: 'Ждёт' })
    expect(configWords(config, 'list', { more: 'More' })).toEqual({ more: 'More' })
    expect(configWords({}, 'upload', undefined)).toBeUndefined()
  })

  it('its element says the language, the direction and the mode it sets, and nothing it does not', () => {
    expect(connect({ locale: 'ar-EG', dir: 'rtl', mode: 'dark' }, same).rootProps).toMatchObject({
      'data-scope': 'config-provider',
      'data-part': 'root',
      lang: 'ar-EG',
      dir: 'rtl',
      'data-mode': 'dark',
    })
    const bare = connect({}, same).rootProps
    expect([bare.lang, bare.dir, bare['data-mode']]).toEqual([undefined, undefined, undefined])
  })
})
