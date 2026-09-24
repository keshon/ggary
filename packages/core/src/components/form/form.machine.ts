import { createMachine, withEffects, type Machine } from '../../machine'
import type { FormEvent, FormState, FormStatus } from './form.types'

const clean = (errors: Record<string, string | null | undefined | false>) =>
  Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''))

export function reducer(state: FormState, event: FormEvent): FormState {
  switch (event.type) {
    case 'REGISTER': {
      const known = state.fields[event.name]
      if (known && known.id === event.id && known.label === event.label) return state
      return { ...state, fields: { ...state.fields, [event.name]: { id: event.id, label: event.label } } }
    }
    case 'UNREGISTER': {
      if (state.fields[event.name]?.id !== event.id) return state
      const { [event.name]: _gone, ...fields } = state.fields
      return { ...state, fields }
    }
    case 'SUMMARY_MOUNT':
      return { ...state, summaries: state.summaries + 1 }
    case 'SUMMARY_UNMOUNT':
      return { ...state, summaries: Math.max(0, state.summaries - 1) }
    case 'INVALID':
      return {
        ...state,
        status: 'invalid',
        errors: clean(event.errors),
        message: null,
        submitCount: state.submitCount + 1,
        focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 },
      }
    case 'SUMMARY':
      return { ...state, summary: event.items }
    case 'SUBMITTING':
      return { ...state, status: 'submitting', errors: {}, message: null, summary: [], submitCount: state.submitCount + 1 }
    case 'SUBMITTED': {
      const errors = clean(event.errors ?? {})
      const failed = Object.keys(errors).length > 0 || !!event.message
      if (!failed) return { ...state, status: 'submitted', errors: {}, message: null, summary: [] }
      return {
        ...state,
        status: 'failed',
        errors,
        message: event.message ?? null,
        focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 },
      }
    }
    case 'EDITED': {
      if (!(event.name in state.errors)) return state
      const { [event.name]: _fixed, ...errors } = state.errors
      return { ...state, errors }
    }
    case 'RULES': {
      // The rules' own names are replaced; a server's error on another name stands.
      const kept = Object.fromEntries(Object.entries(state.errors).filter(([name]) => !event.names.includes(name)))
      const errors = { ...kept, ...clean(event.errors) }
      const same = Object.keys(errors).length === Object.keys(state.errors).length && Object.entries(errors).every(([name, text]) => state.errors[name] === text)
      return same ? state : { ...state, errors }
    }
    case 'SET_ERRORS':
      return { ...state, errors: clean(event.errors), message: event.message ?? state.message, status: 'failed', focus: { target: state.summaries > 0 ? 'summary' : 'first', nonce: state.focus.nonce + 1 } }
    case 'RESET':
      return { ...state, errors: {}, message: null, status: 'idle', submitCount: 0, summary: [] }
  }
}

export function initialState(id: string): FormState {
  return { id, errors: {}, message: null, status: 'idle', submitCount: 0, fields: {}, summaries: 0, summary: [], focus: { target: null, nonce: 0 } }
}

export function createFormMachine(config: { id: string; onStatusChange?: (status: FormStatus) => void }): Machine<FormState, FormEvent> {
  return withEffects(createMachine(initialState(config.id), reducer), (previous, next) => {
    if (previous.status !== next.status) config.onStatusChange?.(next.status)
  })
}
