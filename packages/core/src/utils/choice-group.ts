import type { Anatomy, Dict } from '../types'
import type { GroupContext } from './group'

export type ChoiceGroupOrientation = 'vertical' | 'horizontal'

export interface ChoiceGroupFrameOptions {
  id: string
  role: 'radiogroup' | 'group'
  label?: string
  orientation?: ChoiceGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  /** From an enclosing Fieldset. */
  group?: GroupContext
}

/**
 * The frame RadioGroup and CheckboxGroup share — root, label, list — so the two
 * option lists cannot drift apart in markup or in how they sit in a Fieldset.
 *
 * Standing alone, the root is the group: it has the role and is named by its
 * label. Inside a Fieldset without a label of its own, the <fieldset> already
 * is that group, named by its legend and described by its hint or error, and a
 * second, unnamed group inside would only be announced as noise; the root is
 * then a plain container. Either way the fieldset's required, disabled and
 * invalid state reach the inputs.
 */
export function choiceGroupFrame<P extends 'root' | 'label' | 'list'>(anatomy: Anatomy<P>, options: ChoiceGroupFrameOptions) {
  const { id, role, label, orientation = 'vertical', group } = options
  const disabled = Boolean(options.disabled || group?.disabled)
  const required = Boolean(options.required || group?.required)
  const invalid = Boolean(options.invalid || group?.invalid)
  const isGroup = !group || Boolean(label)
  const ids = { root: id, label: `${id}-label`, item: (index: number) => `${id}-item-${index}` }

  return {
    ids,
    disabled,
    required,
    invalid,
    rootProps: {
      ...anatomy.attrs('root' as P),
      id: ids.root,
      role: isGroup ? role : undefined,
      'aria-labelledby': isGroup && label ? ids.label : undefined,
      'aria-required': isGroup && required ? 'true' : undefined,
      'aria-invalid': isGroup && invalid ? 'true' : undefined,
      'aria-disabled': isGroup && disabled ? 'true' : undefined,
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
      'data-invalid': invalid ? '' : undefined,
    } as Dict,
    labelProps: { ...anatomy.attrs('label' as P), id: ids.label } as Dict,
    listProps: { ...anatomy.attrs('list' as P), 'data-orientation': orientation } as Dict,
  }
}
