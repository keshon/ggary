/**
 * What a Fieldset hands the option group inside it (RadioGroup, CheckboxGroup).
 *
 * The <fieldset> IS the group: its <legend> names it and its hint or error
 * describes it. So a group inside one does not name or describe itself again —
 * a screen reader would announce everything twice — and takes the fieldset's
 * state instead: its inputs become required, disabled and aria-invalid.
 */
export interface GroupContext {
  invalid: boolean
  required: boolean
  disabled: boolean
}

type Validatable = Element & { validity: ValidityState; validationMessage: string; willValidate: boolean }

/**
 * A group's validity is its controls'. Read from `validity`, never through
 * checkValidity(): that fires `invalid` on every failing control, which is a
 * submit attempt as far as the group's own listener can tell.
 */
export function groupValidity(root: Element | null): { valid: boolean; message: string } {
  const controls = root
    ? [...root.querySelectorAll('input, select, textarea')].filter(
        (el): el is Validatable => 'validity' in el && (el as Validatable).willValidate
      )
    : []
  const failing = controls.find((control) => !control.validity.valid)
  return { valid: !failing, message: failing?.validationMessage ?? '' }
}
