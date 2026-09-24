import type { Machine } from '../../machine'
import type { PaletteEvent, PaletteLoad, PaletteState } from './command-palette.types'

/**
 * Records from a server, on the top level: asked when the palette is open and
 * the typing pauses; a new question aborts the one in flight, and an answer
 * to a question no longer asked is dropped. Returns the cleanup.
 */
export function attachPaletteSource(machine: Machine<PaletteState, PaletteEvent>, load: PaletteLoad, { debounce = 150, minLength = 2 }: { debounce?: number; minLength?: number } = {}): () => void {
  let request = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: AbortController | null = null
  let asked: string | null = null

  const ask = (query: string) => {
    inFlight?.abort()
    asked = query
    const id = ++request
    if (query.trim().length < minLength) {
      inFlight = null
      machine.send({ type: 'LOADING', request: id })
      machine.send({ type: 'RESULTS', request: id, query, items: [] })
      return
    }
    const controller = new AbortController()
    inFlight = controller
    machine.send({ type: 'LOADING', request: id })
    Promise.resolve()
      .then(() => load(query, controller.signal))
      .then(
        (items) => {
          if (!controller.signal.aborted) machine.send({ type: 'RESULTS', request: id, query, items })
        },
        (error) => {
          if (!controller.signal.aborted && !(error instanceof Error && error.name === 'AbortError')) machine.send({ type: 'FAILED', request: id })
        }
      )
  }

  const unsubscribe = machine.subscribe((state) => {
    if (!state.open || state.path.length > 0) {
      clearTimeout(timer)
      return
    }
    if (state.query === asked) return
    clearTimeout(timer)
    const query = state.query
    timer = setTimeout(() => ask(query), debounce)
  })
  return () => {
    unsubscribe()
    clearTimeout(timer)
    inFlight?.abort()
  }
}
