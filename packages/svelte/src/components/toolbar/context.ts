import { getContext, setContext } from 'svelte'
const key = Symbol('gg-toolbar')
export const provideToolbar = (managed: () => boolean) => setContext(key, managed)
export const useToolbar = () => getContext<(() => boolean) | undefined>(key) ?? (() => false)
