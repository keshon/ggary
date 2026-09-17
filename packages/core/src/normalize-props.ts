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

/**
 * `style` is canonical as an object of custom properties — a data channel such
 * as a slider's fill, never a look. React takes the object; an attribute needs
 * the declaration text.
 */
const styleText = (style: Dict) =>
  Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ')

/** Drop `undefined` (absent) and `false` (absent boolean attribute). */
const isAbsent = (v: unknown) => v === undefined || v === null || v === false

/**
 * Props that frameworks set as DOM PROPERTIES, where `false` is a value, not
 * an absence. A controlled checkbox rendered without `checked` when unchecked is
 * not controlled at all: React warns and Svelte leaves the old state in place.
 * The DOM normalizer still drops it — there `checked` is an attribute, and the
 * attribute is only the default.
 */
const KEEP_FALSE = new Set(['checked'])
const isAbsentProp = (key: string, v: unknown) => isAbsent(v) && !(v === false && KEEP_FALSE.has(key))

/**
 * React: handler keys and camelCase DOM props are already correct; only the
 * historical renames need doing.
 */
export const reactNormalizer: Normalizer = (props: Dict) => {
  const out: Dict = {}
  for (const [key, value] of Object.entries(props)) {
    if (isAbsentProp(key, value)) continue
    if (key === 'class') out.className = value
    else if (key === 'for') out.htmlFor = value
    // React names the native `input` event `onChange`, and a controlled input
    // without onChange is read-only in React. Same event, React's word for it.
    else if (key === 'onInput') out.onChange = value
    // React's onBlur and onFocus already bubble — they are focusout and focusin.
    else if (key === 'onFocusOut') out.onBlur = value
    else if (key === 'onFocusIn') out.onFocus = value
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
    if (isAbsentProp(key, value)) continue
    if (isHandler(key)) out[key.toLowerCase()] = value
    else if (key === 'style' && typeof value === 'object') out.style = styleText(value)
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
    attrs[name] = value === true ? '' : key === 'style' && typeof value === 'object' ? styleText(value) : String(value)
  }
  return { attrs, listeners }
}
