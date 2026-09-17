import { createMachine, type Machine } from '../../machine'
import type { FieldEvent, FieldState } from './field.types'

/**
 * Field validation, as a pure reducer.
 *
 * The rule it encodes is the platform's `:user-invalid`, written down so all
 * three adapters and the ARIA follow it — not only the stylesheet:
 *
 *   before the user leaves the control   no native error, however invalid
 *   on leaving, or on a submit attempt   the native error shows
 *   once shown                           it clears live as the value is fixed
 *
 * An owner-declared `invalid` shows at once; it is the owner's call.
 */
export function reducer(state: FieldState, event: FieldEvent): FieldState {
  switch (event.type) {
    case 'SYNC': {
      const next = {
        required: event.required ?? false,
        disabled: event.disabled ?? false,
        readOnly: event.readOnly ?? false,
        invalid: event.invalid ?? false,
      }
      if (
        next.required === state.required &&
        next.disabled === state.disabled &&
        next.readOnly === state.readOnly &&
        next.invalid === state.invalid
      ) {
        return state
      }
      return { ...state, ...next }
    }

    case 'BLUR': {
      if (state.touched && state.valid === event.valid && state.message === event.message) return state
      return { ...state, touched: true, valid: event.valid, message: event.message }
    }

    case 'INPUT': {
      // Typing into an untouched field must not surface an error mid-word, and
      // must not re-render on every keystroke either: it changes nothing.
      if (!state.touched) return state
      if (state.valid === event.valid && state.message === event.message) return state
      return { ...state, valid: event.valid, message: event.message }
    }

    case 'INVALID': {
      if (state.touched && !state.valid && state.message === event.message) return state
      return { ...state, touched: true, valid: false, message: event.message }
    }

    case 'RESET': {
      if (!state.touched && state.valid && state.message === '') return state
      return { ...state, touched: false, valid: true, message: '' }
    }

    default:
      return state
  }
}

export interface FieldConfig {
  id: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
}

export function initialState(config: FieldConfig): FieldState {
  return {
    id: config.id,
    required: config.required ?? false,
    disabled: config.disabled ?? false,
    readOnly: config.readOnly ?? false,
    invalid: config.invalid ?? false,
    touched: false,
    valid: true,
    message: '',
  }
}

export const createFieldMachine = (config: FieldConfig): Machine<FieldState, FieldEvent> =>
  createMachine(initialState(config), reducer)
