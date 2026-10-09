import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { Field as BaseField } from '@base-ui/react/field'

interface SelectionConstraintProps {
  id: string
  controlId: string
  name?: string
  value: string
  required: boolean
  disabled: boolean
  readOnly: boolean
  message?: string
  /** Additional accepted value owned by the same compound control. */
  revision?: string | number
  focusTarget: RefObject<HTMLElement | null>
  onValidityChange: () => void
}

const hidden: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
}

/** Native constraints/submission for a custom selection control, not a second editor. */
export function SelectionConstraint({ id, controlId, name, value, required, disabled, readOnly, message = '', revision, focusTarget, onValidityChange }: SelectionConstraintProps) {
  const input = useRef<HTMLInputElement>(null)
  const changed = useRef(onValidityChange)
  changed.current = onValidityChange
  useLayoutEffect(() => {
    input.current?.setCustomValidity(disabled || readOnly ? '' : message)
    changed.current()
  }, [value, required, disabled, readOnly, message, revision])
  return <BaseField.Control ref={input} id={id} name={name} value={value}
    required={required} disabled={disabled} readOnly={readOnly} autoComplete="off"
    onFocus={() => focusTarget.current?.focus({ preventScroll: true })}
    render={props => <input {...props} type="text" id={id} tabIndex={-1}
      aria-hidden="true" data-gg-control-id={controlId} style={hidden} />} />
}
