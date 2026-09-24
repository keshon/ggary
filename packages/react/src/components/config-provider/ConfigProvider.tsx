import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { applyConfig, connect, resolveConfig, type ConfigPick, type KitConfig } from '@ggary/core/config-provider'
import { reactNormalizer } from '@ggary/core'

const ConfigContext = createContext<KitConfig>({})

export interface ConfigProviderProps extends KitConfig {
  children?: ReactNode
}

/**
 * Settings for everything under it: the locale dates, times and numbers are
 * written in, the direction, the controls' size, a light or dark island, and
 * the kit's words. A component's own prop always wins; a provider inside
 * another changes only what it sets.
 */
export function ConfigProvider({ children, locale, dir, size, mode, words }: ConfigProviderProps) {
  const outer = useContext(ConfigContext)
  const config = useMemo(() => resolveConfig(outer, { locale, dir, size, mode, words }), [outer, locale, dir, size, mode, words])
  // The element says only what this provider sets: the rest is already said above it, and inherited.
  const api = connect({ locale, dir, mode }, reactNormalizer)
  return (
    <ConfigContext.Provider value={config}>
      <div {...api.rootProps}>{children}</div>
    </ConfigContext.Provider>
  )
}

/** The settings in force here. */
export const useConfig = () => useContext(ConfigContext)

/** A component's props with the settings in force filled in where it left them out: see `applyConfig`. */
export function useConfigured<P extends object>(props: P, pick: ConfigPick): P {
  return applyConfig(props, useContext(ConfigContext), pick)
}
