import { forwardRef, useRef, type InputHTMLAttributes } from 'react'
import { connect, type SearchProps as CoreSearchProps } from '@ggary/core/search'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'

export interface SearchProps
  extends CoreSearchProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreSearchProps | 'type' | 'value' | 'defaultValue' | 'onChange' | 'size'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(props, forwardedRef) {
  const { size, name, placeholder, label, disabled, readOnly, required, invalid, value, defaultValue, onValueChange, ...rest } = props

  const api = connect(
    { size, name, placeholder, label, disabled, readOnly, required, invalid },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined }
  )

  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element)

  const valueProps = value !== undefined ? { value } : { defaultValue }
  return (
    <span {...api.rootProps}>
      <span {...api.iconProps} />
      <input ref={ref} {...mergeProps(rest, api.inputProps)} {...valueProps} />
    </span>
  )
})
