import type { Dict, Normalizer } from '../../types'
import { inputGroupAnatomy as anatomy } from './input-group.anatomy'
import type { InputGroupProps } from './input-group.types'

/**
 * A field with something flush against it: "$" before the number, "per hour"
 * after it, a button at the end.
 *
 * The border belongs to the GROUP, not to the field inside it: on the join two
 * borders give two lines, and focus would ring half the control. The affixes
 * are plain text in the flow, not labels — a unit that matters belongs in the
 * field's label or hint as well, because an affix names nothing.
 */
export function connect<T = Dict>(props: InputGroupProps, normalize: Normalizer<T>) {
  const { prefix, suffix, size = 'md', disabled, invalid } = props
  const state = {
    'data-size': size,
    'data-disabled': disabled ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  return {
    showPrefix: prefix !== undefined && prefix !== '',
    showSuffix: suffix !== undefined && suffix !== '',
    prefix,
    suffix,
    rootProps: normalize({ ...anatomy.attrs('root'), ...state }),
    prefixProps: normalize({ ...anatomy.attrs('prefix'), ...state }),
    suffixProps: normalize({ ...anatomy.attrs('suffix'), ...state }),
  }
}
