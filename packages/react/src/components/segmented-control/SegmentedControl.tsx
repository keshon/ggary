import { useId, useRef, useState } from 'react'
import { connect, type SegmentedControlSize, type SegmentedItem } from '@ggary/core/segmented-control'
import { reactNormalizer } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useConfigured } from '../config-provider'

export interface SegmentedControlProps {
  items: SegmentedItem[]
  /** The name of the control: only the options have visible text. */
  label: string
  name?: string
  /** Controlled; omit for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  size?: SegmentedControlSize
  disabled?: boolean
  required?: boolean
  fullWidth?: boolean
}

export function SegmentedControl(props: SegmentedControlProps) {
  props = useConfigured(props, { size: true })
  const { items, label, name, value, defaultValue = null, onValueChange, size, disabled, required, fullWidth } = props
  const id = `gg-segmented-${useId().replace(/:/g, '')}`
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const controlled = value !== undefined

  const api = connect(
    { id, items, label, name, value: controlled ? value : uncontrolled, size, disabled, required, fullWidth },
    reactNormalizer,
    {
      onValueChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onValueChange?.(next)
      },
    }
  )

  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => setUncontrolled(defaultValue))

  return (
    <div ref={root} {...api.rootProps}>
      {items.map((item, index) => {
        const parts = api.getItemProps(item, index)
        return (
          <label key={item.value} {...parts.itemProps}>
            <input {...parts.inputProps} />
            <span {...parts.textProps}>{item.label}</span>
          </label>
        )
      })}
    </div>
  )
}
