export type Dict = Record<string, any>

/**
 * The seam that makes one `connect()` serve every framework.
 *
 * `connect()` emits ONE canonical prop shape: DOM attribute names as-is
 * (`aria-expanded`, `data-part`, `id`), camelCase DOM properties (`tabIndex`,
 * `readOnly`), `class`, and React-style handler keys (`onClick`, `onKeyDown`).
 * Each adapter passes its own normalizer to translate that into what its
 * framework actually wants.
 *
 * Without this, you end up with three divergent copies of `connect()`.
 */
export type Normalizer<T = Dict> = (props: Dict) => T

/** Every component exports an anatomy: the named parts CSS and tests key off. */
export type Anatomy<Part extends string> = {
  readonly scope: string
  readonly parts: readonly Part[]
  /** `[data-scope="select"][data-part="trigger"]` — the public styling contract. */
  selector(part: Part): string
  /** Props every part carries, so no component hand-writes these two keys. */
  attrs(part: Part): { 'data-scope': string; 'data-part': Part }
}

export function createAnatomy<const Part extends string>(
  scope: string,
  parts: readonly Part[]
): Anatomy<Part> {
  return {
    scope,
    parts,
    selector: (part) => `[data-scope="${scope}"][data-part="${part}"]`,
    attrs: (part) => ({ 'data-scope': scope, 'data-part': part }),
  }
}
