import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { connect, type FileDropProps as CoreFileDropProps } from '@ggary/core/file-drop'
import { attachFileDrop, mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'

export interface FileDropProps
  extends Omit<CoreFileDropProps, 'files'>,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreFileDropProps | 'type' | 'onChange' | 'size'> {
  /** The names shown under the call to action. Omit and the component shows what was chosen. */
  files?: string[]
  onFilesChange?: (files: File[]) => void
}

export const FileDrop = forwardRef<HTMLInputElement, FileDropProps>(function FileDrop(props, forwardedRef) {
  const { name, accept, multiple, label, hint, disabled, required, invalid, files, listFiles, keepRefused, onFilesChange, ...rest } = props
  const [dragging, setDragging] = useState(false)
  const [chosen, setChosen] = useState<string[]>([])

  const api = connect(
    { name, accept, multiple, label, hint, disabled, required, invalid, listFiles, files: files ?? chosen },
    reactNormalizer,
    {
      dragging,
      field: useFieldControl() ?? undefined,
      onFilesChange: (list) => {
        setChosen(list.map((file) => file.name))
        onFilesChange?.(list)
      },
    }
  )

  const zone = useRef<HTMLLabelElement>(null)
  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  const keep = useRef(keepRefused)
  keep.current = keepRefused
  useEffect(
    () => (zone.current ? attachFileDrop(zone.current, () => element.current, { onDraggingChange: setDragging, keepRefused: () => Boolean(keep.current) }) : undefined),
    []
  )
  useFormReset(element, () => setChosen([]))

  return (
    <label ref={zone} {...api.rootProps}>
      <span {...api.iconProps} />
      <input ref={ref} {...mergeProps(rest, api.inputProps)} />
      <span {...api.textProps}>{api.label}</span>
      {api.showFiles && <span {...api.filesProps}>{api.filesText}</span>}
      {api.showHint && <span {...api.hintProps}>{api.hint}</span>}
    </label>
  )
})
