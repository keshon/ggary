import type { Dict, Normalizer } from '../../types'
import { configProviderAnatomy as anatomy } from './config-provider.anatomy'
import type { KitConfig, KitWords } from './config-provider.types'

/**
 * A provider inside another: what the inner one sets wins, what it leaves
 * alone is the outer one's. Words merge a component at a time and a key at a
 * time, so an inner provider can change one word without losing the rest.
 */
export function resolveConfig(outer: KitConfig, inner: KitConfig): KitConfig {
  const words: KitWords = { ...outer.words }
  for (const [name, own] of Object.entries(inner.words ?? {}) as [keyof KitWords, object | undefined][]) {
    if (own) (words as Record<string, object>)[name] = { ...(outer.words?.[name] as object | undefined), ...own }
  }
  return {
    locale: inner.locale ?? outer.locale,
    dir: inner.dir ?? outer.dir,
    size: inner.size ?? outer.size,
    mode: inner.mode ?? outer.mode,
    words,
  }
}

/** A component's words: the provider's for it, with the component's own laid over them, key by key. */
export function configWords<W extends object>(config: KitConfig, name: keyof KitWords, own: W): W
export function configWords<W extends object>(config: KitConfig, name: keyof KitWords, own: W | undefined): W | undefined
export function configWords<W extends object>(config: KitConfig, name: keyof KitWords, own: W | undefined): W | undefined {
  const given = config.words?.[name] as W | undefined
  if (!given) return own
  return own ? { ...given, ...own } : given
}

/** Which settings a component takes: its locale, its size (controls only), and its words under this name. */
export interface ConfigPick {
  locale?: boolean
  size?: boolean
  words?: keyof KitWords
}

/**
 * A component's props with the provider's settings filled in where the
 * component left them out. Only what the component takes is touched — a
 * `size` added to a link that spreads its props onto an `<a>` would become an
 * attribute — and the component's own words are laid over the provider's,
 * key by key.
 */
export function applyConfig<P extends object>(props: P, config: KitConfig, pick: ConfigPick): P {
  const own = props as P & { locale?: string; size?: string; words?: object }
  const next = { ...props } as Record<string, unknown>
  let changed = false
  const set = (key: string, value: unknown) => {
    next[key] = value
    changed = true
  }
  if (pick.locale && own.locale === undefined && config.locale !== undefined) set('locale', config.locale)
  if (pick.size && own.size === undefined && config.size !== undefined) set('size', config.size)
  if (pick.words && config.words?.[pick.words]) set('words', configWords(config, pick.words, own.words))
  return changed ? (next as unknown as P) : props
}

/** The provider's element: its language, its direction and its mode, and no box. */
export function connect<T = Dict>(props: KitConfig, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({
      ...anatomy.attrs('root'),
      lang: props.locale,
      dir: props.dir,
      'data-mode': props.mode,
    }),
  }
}
