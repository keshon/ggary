import type { Machine } from '../../machine'
import type { ComboboxEvent, ComboboxItem, ComboboxState } from './combobox.types'

/**
 * A server that answers a query. `signal` aborts when the answer is no longer
 * wanted — the person typed on — and should be passed on to fetch() so the
 * server stops too. Return the items, or the items and how many match in all.
 */
export type ComboboxLoad = (query: string, signal: AbortSignal) => Promise<ComboboxItem[] | { items: ComboboxItem[]; total?: number }>

export interface ComboboxSourceOptions {
  /** How long the typing must pause before the server is asked, in ms. Default 200. */
  debounce?: number
  /** Fewer characters than this ask nothing and show nothing. Default 0: an empty field shows suggestions. */
  minLength?: number
}

const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError'

/**
 * A combobox whose options come from a server. It asks when the list is open
 * and the query settles; a new question aborts the one in flight, and an
 * answer to a question no longer asked is dropped, not drawn. While it waits,
 * the last answer stays on screen, marked as being refreshed.
 *
 * Framework-free: every adapter attaches it the same way, and it is tested in
 * node with fake timers.
 */
export function attachComboboxSource(
  machine: Machine<ComboboxState, ComboboxEvent>,
  load: ComboboxLoad,
  { debounce = 200, minLength = 0 }: ComboboxSourceOptions = {}
): () => void {
  let sequence = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: AbortController | null = null
  let asked: string | null = null

  const ask = (query: string) => {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    const request = ++sequence
    asked = query
    machine.send({ type: 'LOADING', request })
    if (query.trim().length < minLength) {
      machine.send({ type: 'RESULTS', request, query, items: [] })
      return
    }
    Promise.resolve()
      .then(() => load(query, controller.signal))
      .then(
        (answer) => {
          if (controller.signal.aborted) return
          const { items, total } = Array.isArray(answer) ? { items: answer, total: undefined } : answer
          machine.send({ type: 'RESULTS', request, query, items, total })
        },
        (error) => {
          if (controller.signal.aborted || isAbort(error)) return
          machine.send({ type: 'FAILED', request, message: error instanceof Error ? error.message : String(error) })
        }
      )
  }

  const follow = (state: ComboboxState) => {
    if (!state.open) {
      clearTimeout(timer)
      // A question that failed is asked again when the list opens next.
      if (state.status === 'error') asked = null
      return
    }
    const query = state.typing ? state.query : ''
    // Asked already: the answer is on screen, on its way, or failed — and a
    // failure is not asked again on its own, every 200 ms, but on typing or reopening.
    if (query === asked) return
    clearTimeout(timer)
    timer = setTimeout(() => ask(query), query === '' ? 0 : debounce)
  }

  const stop = machine.subscribe(follow)
  follow(machine.getState())
  return () => {
    stop()
    clearTimeout(timer)
    inFlight?.abort()
  }
}
