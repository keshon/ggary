import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { connect, createCascaderMachine, focusCascaderItem, nodesOf, type CascaderEvent, type CascaderNode } from '@ggary/core/cascader'
import { mergeProps } from '@base-ui/react/merge-props'
import { useFieldControl, useFieldComposition } from '../field/Field'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormField } from '../form/Form'
import { SelectionConstraint } from '../../utils/selection-constraint'
import { reactNormalizer } from '@ggary/core'
import type { ControlSize } from '@ggary/core'
import { Popover as Primitive } from '@base-ui/react/popover'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface CascaderProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  items: CascaderNode[]
  label?: string
  placeholder?: string
  /** The first column's name; the others are named by their parent. Default: the label. */
  rootLabel?: string
  /** Controlled: the chosen path, root first. Omit and use `defaultValue` for uncontrolled. */
  value?: string[] | null
  defaultValue?: string[] | null
  onValueChange?: (value: string[], nodes: CascaderNode[]) => void
  /** A branch may be chosen itself. Default false: leaves only. */
  selectParents?: boolean
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  /** Submits the chosen leaf's value. */
  name?: string
}

/** A choice from a tree, one level to a column. */
export function Cascader(props: CascaderProps) {
  props = useConfigured(props, { size: true })
  const { size, items, label, placeholder, rootLabel, value, defaultValue, onValueChange, selectParents = false, disabled: ownDisabled, required: ownRequired, readOnly: ownReadOnly, name: ownName } = props
  const id = `gg-cascader-${useId().replace(/:/g, '')}`
  const field = useFieldControl()
  const composition = useFieldComposition()
  const group = useFieldsetGroup()
  const { required: _fieldRequired, readOnly: _fieldReadOnly, ...triggerMetadata } = field ?? {}
  const name = composition?.name ?? ownName
  const disabled = Boolean(ownDisabled || field?.disabled || group?.disabled)
  const required = Boolean(ownRequired || field?.required)
  const readOnly = Boolean(ownReadOnly || field?.readOnly)
  const triggerId = (field?.id as string | undefined) ?? `${id}-trigger`
  const form = useFormField(composition?.name ? undefined : name, triggerId, field?.['aria-labelledby'] ? undefined : label)
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }
  const [machine] = useState(() =>
    createCascaderMachine({ id, items, value, defaultValue, selectParents, disabled, onValueChange: (next, nodes) => callbacks.current.onValueChange?.(next, nodes) })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const send = (event: CascaderEvent) => {
    if (disabled && event.type !== 'CLOSE') return
    if (readOnly && event.type === 'SELECT') {
      const current = machine.getState()
      const level = event.level ?? current.focusLevel
      const requested = event.value ?? current.active[level]
      const path = requested === undefined ? [] : [...current.active.slice(0, level), requested]
      const nodes = nodesOf(current.items, path)
      if (!path.length || nodes.length !== path.length || nodes.some(node => node.disabled)) return
      if (event.value !== undefined) machine.send({ type: 'HIGHLIGHT', level, value: event.value })
      const next = machine.getState()
      const node = nodesOf(next.items, next.active)[level]
      // Read-only still permits walking branches, even with selectParents.
      if (node?.children?.length && !node.disabled) machine.send({ type: 'INTO' })
      return
    }
    machine.send(event)
  }
  const api = connect(state, send, reactNormalizer, { label, placeholder, rootLabel, name, size })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', selectParents, disabled }), [machine, selectParents, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: value ?? [] })
  }, [machine, value])

  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useFormReset(triggerRef, () => {
    machine.send({ type: 'CLOSE' })
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: defaultValue ?? [] })
  })

  const accepted = api.chosen
  const completePath = accepted.length === state.value.length && accepted.every(node => !node.disabled)
  const terminal = accepted[accepted.length - 1]
  const eligible = completePath && (!terminal || selectParents || !api.hasChildren(terminal))
  const constraintMessage = state.value.length && !eligible ? 'Choose an available option.' : ''
  const environment = useOverlayEnvironment(triggerRef, state.open)
  const { onClick: _legacyToggle, ...triggerProps } = api.triggerProps
  const { popover: _nativePopover, ...positionerProps } = api.positionerProps

  useLayoutEffect(() => focusCascaderItem(contentRef.current, api.focusedId), [api.focusedId])

  return (
    <DirectionProvider direction={environment.dir ?? 'ltr'}>
    <Primitive.Root open={state.open} modal={false} onOpenChange={next => send({ type: next ? 'OPEN' : 'CLOSE' })}>
    <div {...api.rootProps} data-disabled={disabled ? '' : undefined} data-readonly={readOnly ? '' : undefined}>
      {label && !field?.['aria-labelledby'] && <label {...api.labelProps} htmlFor={triggerId}>{label}</label>}
      <Primitive.Trigger ref={triggerRef} {...mergeProps(triggerProps, form.field.controlProps, triggerMetadata, form.error ? form.field.controlProps : {}, {
        id: triggerId,
        'aria-describedby': [field?.['aria-describedby'], form.field.controlProps['aria-describedby']].filter(Boolean).join(' ') || undefined,
        'aria-labelledby': field?.['aria-labelledby'] ? `${field['aria-labelledby']} ${api.ids.value}` : triggerProps['aria-labelledby'],
      })} disabled={disabled} data-readonly={readOnly ? '' : undefined}>
        <span {...api.valueProps}>
          {api.chosen.length === 0
            ? api.placeholder
            : api.chosen.map((node, i) => (
                <Fragment key={node.value}>
                  {i > 0 && <span {...api.separatorProps} />}
                  <span {...api.valueItemProps}>{node.label}</span>
                </Fragment>
              ))}
        </span>
        <span {...api.indicatorProps} />
      </Primitive.Trigger>
      <Primitive.Portal keepMounted container={environment.container}>
      <Primitive.Positioner {...positionerProps} data-backend="base-ui" side="bottom" align="start" sideOffset={4}
        positionMethod="fixed" data-mode={environment.mode} dir={environment.dir} lang={environment.locale} style={{ ...environment.style, '--gg-available-height': 'var(--available-height, 320px)' } as CSSProperties}>
        <Primitive.Popup ref={contentRef} {...api.contentProps} data-backend="base-ui" finalFocus={triggerRef}
          aria-labelledby={field?.['aria-labelledby'] as string | undefined}
          initialFocus={() => api.focusedId ? document.getElementById(api.focusedId) ?? contentRef.current : contentRef.current}>
          {api.columns.map((column, level) => (
            <ul key={level} {...api.getColumnProps(level)} aria-readonly={readOnly || undefined} aria-labelledby={level === 0 && !rootLabel && !label ? field?.['aria-labelledby'] as string | undefined : undefined}>
              {column.map((node) => (
                <li key={node.value} {...api.getItemProps(node, level)}>
                  <span {...api.itemTextProps}>{node.label}</span>
                  {api.hasChildren(node) ? <span {...api.getItemBranchProps(node, level)} /> : <span {...api.itemIndicatorProps} />}
                </li>
              ))}
            </ul>
          ))}
        </Primitive.Popup>
      </Primitive.Positioner>
      </Primitive.Portal>
      {!composition?.name && <span {...form.field.errorProps}>{form.error}</span>}
      <SelectionConstraint id={`${id}-constraint`} controlId={triggerId} name={name}
        value={state.value[state.value.length - 1] ?? ''} required={required}
        disabled={disabled} readOnly={readOnly} message={constraintMessage} focusTarget={triggerRef}
        onValidityChange={() => {
          if (composition) composition.edited()
          if (!composition?.name) form.edited(triggerRef.current)
          group?.refresh()
        }} />
    </div>
    </Primitive.Root>
    </DirectionProvider>
  )
}
