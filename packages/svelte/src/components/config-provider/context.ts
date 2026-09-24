import { getContext, setContext } from 'svelte'
import type { KitConfig } from '@ggary/core/config-provider'

const CONFIG = Symbol('gg-config')
const NONE: KitConfig = {}

/**
 * The settings in force here, as a getter: read inside `$derived`, a change of
 * the provider's locale or words reaches the component without remounting it.
 */
export function getConfig(): () => KitConfig {
  return getContext<(() => KitConfig) | undefined>(CONFIG) ?? (() => NONE)
}

export function provideConfig(read: () => KitConfig) {
  setContext(CONFIG, read)
}
