import type { ChoiceGroupOrientation } from '../../utils/choice-group'

/** radio when the options exclude one another, checkbox when they do not. */
export type ChoiceCardType = 'radio' | 'checkbox'

export interface ChoiceCardItem {
  value: string
  title: string
  /** What the option costs or implies. Without one, use the plain toggles instead. */
  description?: string
  disabled?: boolean
}

export interface ChoiceCardGroupProps {
  id: string
  items: ChoiceCardItem[]
  type?: ChoiceCardType
  /** Shared by the inputs, which is what makes radios one group. Defaults to the id. */
  name?: string
  /** A string for radios, an array for checkboxes. */
  value?: string | string[] | null
  label?: string
  orientation?: ChoiceGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}
