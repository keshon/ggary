import { forwardRef, useRef, type Ref } from 'react'
import { Field as BaseField } from '@base-ui/react/field'
import { useRender } from '@base-ui/react/use-render'
import { useFieldControl } from './Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'

export interface FieldControlProps extends Omit<BaseField.Control.Props, 'onValueChange'> {
  /** GGary callbacks expose only the accepted/requested string value. */
  onValueChange?: (value: string) => void
}

function ControlElement({ ownRender, state, ...props }: Record<string, unknown> & {
  ownRender?: BaseField.Control.Props['render']; state: BaseField.Control.State; ref?: Ref<HTMLElement>
}) {
  const field = useFieldControl()
  return useRender({
    defaultTagName: 'input',
    render: typeof ownRender === 'function' ? renderProps => ownRender(renderProps, state) : ownRender,
    ref: props.ref,
    props: { ...props, ...(field ? {
      'aria-invalid': field['aria-invalid'], 'data-invalid': field['data-invalid'],
      'aria-describedby': field['aria-describedby'],
    } : {}) },
  })
}

/**
 * Registers ONE custom native input, textarea or select with GGary Field.
 * Render must forward the supplied props/ref to that native element. Do not
 * wrap a GGary/Base UI primitive: it already registers its own control.
 * Presentation belongs to the custom control; this adapter is unstyled.
 */
export const FieldControl = forwardRef<HTMLElement, FieldControlProps>(function FieldControl(props, forwardedRef) {
  const { render, onValueChange, ...rest } = props
  const field = useFieldControl()
  const element = useRef<HTMLElement>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element)
  return <BaseField.Control {...rest} ref={ref}
    id={(field?.id as string | undefined) ?? rest.id}
    disabled={Boolean(rest.disabled || field?.disabled)} required={Boolean(rest.required || field?.required)}
    readOnly={Boolean(rest.readOnly || field?.readOnly)} data-backend="base-ui"
    onValueChange={next => onValueChange?.(next)}
    render={(controlProps, state) => <ControlElement {...controlProps} state={state} ownRender={render} />} />
})
