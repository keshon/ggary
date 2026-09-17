import { forwardRef, useCallback, useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'
import { connect, type TextareaProps as CoreTextareaProps } from '@ggary/core/textarea'
import { attachAutosize, mergeProps, reactNormalizer, type Autosize } from '@ggary/core'
import { useFieldControl } from '../field/Field'

export interface TextareaProps
  extends CoreTextareaProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof CoreTextareaProps | 'value' | 'defaultValue' | 'onChange'> {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, forwardedRef) {
  const {
    size, name, placeholder, rows, minLength, maxLength, autoComplete, disabled, readOnly, required, invalid,
    resize, autoResize, maxRows, value, defaultValue, onValueChange, ...rest
  } = props

  const api = connect(
    { size, name, placeholder, rows, minLength, maxLength, autoComplete, disabled, readOnly, required, invalid, resize, autoResize, maxRows },
    reactNormalizer,
    { onValueChange, field: useFieldControl() ?? undefined }
  )

  const element = useRef<HTMLTextAreaElement | null>(null)
  const autosize = useRef<Autosize | null>(null)

  const ref = useCallback(
    (node: HTMLTextAreaElement | null) => {
      element.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef]
  )

  // Layout effects, so the first paint already has the measured height.
  useLayoutEffect(() => {
    if (!api.autosize || !element.current) return
    const instance = attachAutosize(element.current, api.autosize)
    autosize.current = instance
    return () => {
      instance.destroy()
      autosize.current = null
    }
  }, [autoResize])

  useLayoutEffect(() => autosize.current?.setOptions({ maxRows }), [maxRows])

  // A value pushed by the owner fires no input event, so nothing re-measured it.
  useLayoutEffect(() => autosize.current?.update(), [value])

  const valueProps = value !== undefined ? { value } : { defaultValue }
  return <textarea ref={ref} {...mergeProps(rest, api.rootProps)} {...valueProps} />
})
