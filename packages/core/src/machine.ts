/**
 * A machine is a pure reducer plus a subscription. That is the whole runtime.
 *
 * Deliberately not XState: for UI components the value is in *writing the
 * transitions down explicitly*, not in the library. 40 lines you can read beats
 * a dependency you can't step through, and it keeps `core` cheap.
 *
 * The reducer must be pure and must not touch the DOM — `tests/*.machine.test.ts`
 * runs in a Node environment with no DOM precisely to enforce that.
 */
export type Reducer<S, E> = (state: S, event: E) => S

export interface Machine<S, E> {
  getState(): S
  send(event: E): void
  subscribe(listener: (state: S) => void): () => void
}

export function createMachine<S, E>(initial: S, reducer: Reducer<S, E>): Machine<S, E> {
  let state = initial
  const listeners = new Set<(state: S) => void>()

  return {
    getState: () => state,
    send(event) {
      const next = reducer(state, event)
      // Reference equality is the "nothing happened" signal. Reducers return the
      // same object for ignored events, so this is also what keeps
      // useSyncExternalStore from re-rendering on every keystroke.
      if (next === state) return
      state = next
      for (const listener of listeners) listener(state)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/**
 * Wraps a machine so state *transitions* can fire callbacks. The reducer stays
 * pure; effects live here, in exactly one place, instead of being scattered
 * across three adapters.
 */
export function withEffects<S, E>(
  machine: Machine<S, E>,
  effect: (previous: S, next: S) => void
): Machine<S, E> {
  return {
    ...machine,
    send(event) {
      const previous = machine.getState()
      machine.send(event)
      const next = machine.getState()
      if (next !== previous) effect(previous, next)
    },
  }
}
