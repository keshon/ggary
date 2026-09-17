import type { ChoiceGroupOrientation } from '../../utils/choice-group'

export type CheckboxGroupOrientation = ChoiceGroupOrientation

export interface CheckboxItem {
  value: string
  label: string
  disabled?: boolean
}

export interface CheckboxGroupProps {
  id: string
  items: CheckboxItem[]
  /** Shared by the checkboxes, so the form submits every checked value under it. Defaults to the id. */
  name?: string
  /** The checked values, in item order. */
  value?: string[]
  label?: string
  orientation?: CheckboxGroupOrientation
  disabled?: boolean
  /** At least one checked. */
  required?: boolean
  invalid?: boolean
  /** The browser's validation message when `required` fails. */
  requiredMessage?: string
}
