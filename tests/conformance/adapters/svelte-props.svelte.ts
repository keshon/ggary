/**
 * Svelte 5 components receive props reactively only when the props object is
 * itself reactive, and `$state` is only available in .svelte / .svelte.ts files.
 * This is the one line of the harness that has to live in one.
 */
export function reactiveProps<T extends object>(initial: T): T {
  const props = $state(initial)
  return props
}
