export type RadioGroupOrientation = 'vertical' | 'horizontal'

export interface RadioItem {
  value: string
  label: string
  disabled?: boolean
}

export interface RadioGroupProps {
  id: string
  items: RadioItem[]
  /** Shared by the inputs, which is what makes them one group. Defaults to the id. */
  name?: string
  value?: string | null
  label?: string
  /** Layout only: the arrow keys move in both directions either way, natively. */
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}
