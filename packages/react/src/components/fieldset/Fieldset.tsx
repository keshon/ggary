import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createFieldsetMachine, type GroupContext } from '@ggary/core/fieldset'
import { reactNormalizer } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'

const FieldsetContext = createContext<GroupContext | null>(null)

/** The enclosing Fieldset's state, for an option group inside it. */
export const useFieldsetGroup = () => useContext(FieldsetContext)

export interface FieldsetProps {
  legend?: ReactNode
  hint?: ReactNode
  /** Shown when the group is invalid. Absent, the first failing control's own message is used. */
  error?: string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  children: ReactNode
}

export function Fieldset(props: FieldsetProps) {
  const { legend, hint, error, invalid, required, disabled, children } = props
  const id = `gg-fieldset-${useId().replace(/:/g, '')}`

  const [machine] = useState(() => createFieldsetMachine({ id, invalid, required, disabled }))
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { legend: legend != null, hint: hint != null, error })

  useEffect(
    () => machine.send({ type: 'SYNC', invalid, required, disabled }),
    [machine, invalid, required, disabled]
  )

  const root = useRef<HTMLFieldSetElement>(null)
  useFormReset(root, () => machine.send({ type: 'RESET' }))

  return (
    <fieldset ref={root} {...api.rootProps}>
      {legend != null && <legend {...api.legendProps}>{legend}</legend>}
      <div {...api.contentProps}>
        <FieldsetContext.Provider value={api.group}>{children}</FieldsetContext.Provider>
      </div>
      {hint != null && <div {...api.hintProps}>{hint}</div>}
      <div {...api.errorProps}>{api.errorText}</div>
    </fieldset>
  )
}
