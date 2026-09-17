import type { Dict } from '../types'

// Any casing: canonical and React bags say `onBlur`, Svelte's spread props say
// `onblur`, and a caller's handler must chain in both. Both values must also be
// functions to chain, so an attribute that merely starts with "on" is safe.
const isHandler = (key: string) => /^on[A-Za-z]/.test(key)

/** Attributes whose values are space-separated id lists or class lists. */
const TOKEN_LISTS = new Set(['aria-describedby', 'aria-labelledby', 'aria-controls', 'class'])

/**
 * Combine canonical prop bags that land on ONE element, before normalizing.
 *
 * A control inside a Field receives props from two components: the Field wires
 * ids, ARIA and validation handlers, the Input sets its own look and value
 * handling. Spreading one over the other drops half — the second `onInput`
 * silently replaces the first. So:
 *
 *   handlers           both run, in order
 *   id lists, class    joined, de-duplicated
 *   style objects      merged, the later property wins
 *   an absent value    yields to a present one
 *   anything else      the later bag wins
 *
 * Merge in canonical space and normalize once: normalized keys differ per
 * framework (`onInput` vs `oninput`), and merging after normalization would
 * need three versions of this rule.
 */
export function mergeProps(...bags: (Dict | undefined)[]): Dict {
  const out: Dict = {}
  for (const bag of bags) {
    if (!bag) continue
    for (const [key, value] of Object.entries(bag)) {
      const current = out[key]
      if (value === undefined) continue
      if (current === undefined) {
        out[key] = value
      } else if (isHandler(key) && typeof current === 'function' && typeof value === 'function') {
        out[key] = (...args: unknown[]) => {
          current(...args)
          value(...args)
        }
      } else if (key === 'style' && typeof current === 'object' && typeof value === 'object') {
        out[key] = { ...current, ...value }
      } else if (TOKEN_LISTS.has(key) && typeof current === 'string' && typeof value === 'string') {
        out[key] = [...new Set(`${current} ${value}`.split(/\s+/).filter(Boolean))].join(' ')
      } else {
        out[key] = value
      }
    }
  }
  return out
}
