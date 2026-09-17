import type { Dict, Normalizer } from './types'

const isHandler = (key: string) => /^on[A-Z]/.test(key)

/**
 * Canonical props are React-cased (`readOnly`, `maxLength`); outside React they
 * are plain attributes, whose names are lowercase.
 */
const ATTRIBUTE_NAMES: Record<string, string> = {
  tabIndex: 'tabindex',
  readOnly: 'readonly',
  htmlFor: 'for',
  maxLength: 'maxlength',
  minLength: 'minlength',
  autoComplete: 'autocomplete',
  inputMode: 'inputmode',
}

/** Drop `undefined` (absent) and `false` (absent boolean attribute). */
const isAbsent = (v: unknown) => v === undefined || v === null || v === false

/**
 * React: handler keys and camelCase DOM props are already correct; only the
 * historical renames need doing.
 */
export const reactNormalizer: Normalizer = (props: Dict) => {
  const out: Dict = {}
  for (const [key, value] of Object.entries(props)) {
    if (isAbsent(value)) continue
    if (key === 'class') out.className = value
    else if (key === 'for') out.htmlFor = value
    // React names the native `input` event `onChange`, and a controlled input
    // without onChange is read-only in React. Same event, React's word for it.
    else if (key === 'onInput') out.onChange = value
    else out[key] = value
  }
  return out
}

/**
 * Svelte 5: event attributes are lowercase (`onclick`), and attributes are
 * attributes — `tabindex`, `readonly`, `class`.
 */
export const svelteNormalizer: Normalizer = (props: Dict) => {
  const out: Dict = {}
  for (const [key, value] of Object.entries(props)) {
    if (isAbsent(value)) continue
    if (isHandler(key)) out[key.toLowerCase()] = value
    else out[ATTRIBUTE_NAMES[key] ?? key] = value
  }
  return out
}

export type DomProps = {
  attrs: Record<string, string>
  listeners: Record<string, (event: any) => void>
}

/**
 * Vanilla: split into attributes to set and listeners to add. `spread()` in
 * @ggary/elements consumes this.
 */
export const domNormalizer: Normalizer<DomProps> = (props: Dict) => {
  const attrs: Record<string, string> = {}
  const listeners: Record<string, (event: any) => void> = {}
  for (const [key, value] of Object.entries(props)) {
    if (isAbsent(value)) continue
    if (isHandler(key)) {
      listeners[key.slice(2).toLowerCase()] = value
      continue
    }
    const name = ATTRIBUTE_NAMES[key] ?? key
    attrs[name] = value === true ? '' : String(value)
  }
  return { attrs, listeners }
}
