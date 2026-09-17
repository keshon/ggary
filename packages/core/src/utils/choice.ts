import type { Anatomy, Dict } from '../types'
import { mergeProps } from './merge-props'

/**
 * The parts every choice control has: a <label> root, a control that stacks the
 * native input with what is drawn over it, and the text.
 *
 *   <label root>
 *     <span control>
 *       <input input>          the box, the circle, the track — styled natively
 *       <span indicator|thumb> the check, the dot, the thumb — drawn over it
 *     </span>
 *     <span label>…</span>
 *   </label>
 *
 * The drawing is a sibling, not a pseudo-element on the input: an <input> has
 * no content box, pseudo-elements on it are not rendered in every browser, and
 * a glyph from the icon tokens needs an element of its own to be a mask.
 */
export type ChoicePart = 'root' | 'control' | 'input' | 'label'

export interface ChoiceOptions {
  type: 'checkbox' | 'radio'
  role?: string
  id?: string
  name?: string
  value?: string
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  /**
   * The native input owns its checked state — server markup a custom element
   * enhances. `checked` then only drives the state attributes: writing it back
   * as an attribute would change `defaultChecked`, and with it what a form
   * reset restores.
   */
  nativeChecked?: boolean
  /**
   * The renderer puts `checked` back to the rendered value after every event —
   * React does, for a controlled input. A readonly click then needs no
   * preventDefault, and must not have one: React's restore and the browser's
   * undo of a cancelled click cancel each other out, and the box flips.
   */
  restoresChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  /** The canonical control props of an enclosing Field. */
  field?: Dict
}

export function choice<P extends ChoicePart | 'indicator' | 'thumb'>(anatomy: Anatomy<P>, options: ChoiceOptions) {
  const { type, role, id, name, value, checked, indeterminate = false, required, nativeChecked, restoresChecked, onCheckedChange } =
    options
  // A checkbox has no native readonly. The Field's flag is taken here and turned
  // into aria-readonly plus a blocked click; left in the bag it would become a
  // `readonly` attribute the browser ignores.
  const { readOnly: fieldReadOnly, ...field } = options.field ?? {}
  const disabled = Boolean(options.disabled || field.disabled)
  const readOnly = Boolean(options.readOnly || fieldReadOnly)
  const invalid = Boolean(options.invalid || field['aria-invalid'] === 'true')

  const state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'
  const stateAttrs = {
    'data-state': state,
    'data-disabled': disabled ? '' : undefined,
    'data-readonly': readOnly ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  const own: Dict = {
    ...anatomy.attrs('input' as P),
    ...stateAttrs,
    type,
    role,
    id,
    name,
    value,
    checked: nativeChecked ? undefined : checked,
    disabled: disabled || undefined,
    required: required || undefined,
    'aria-invalid': options.invalid ? 'true' : undefined,
    'aria-readonly': readOnly ? 'true' : undefined,
    // The click is the one event every way of toggling goes through — pointer,
    // Space, a click on the label — so blocking it blocks them all.
    onClick: readOnly && !restoresChecked ? (event: Event) => event.preventDefault() : undefined,
    // Readonly also stays silent here, not only in the blocked click: React
    // derives a checkbox's change from the click and reports it even when the
    // click was cancelled and the box snapped back.
    onInput: onCheckedChange
      ? (event: Event) => {
          if (!readOnly) onCheckedChange((event.currentTarget as HTMLInputElement).checked)
        }
      : undefined,
  }

  return {
    state,
    disabled,
    readOnly,
    rootProps: { ...anatomy.attrs('root' as P), ...stateAttrs } as Dict,
    controlProps: { ...anatomy.attrs('control' as P), ...stateAttrs } as Dict,
    inputProps: mergeProps(own, field),
    labelProps: { ...anatomy.attrs('label' as P), ...stateAttrs } as Dict,
    stateAttrs,
  }
}
