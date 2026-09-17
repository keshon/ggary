import type { Dict, Normalizer } from '../../types'
import { mergeProps } from '../../utils/merge-props'
import { fileDropAnatomy as anatomy } from './file-drop.anatomy'
import type { FileDropProps } from './file-drop.types'

export interface FileDropConnectOptions {
  onFilesChange?: (files: File[]) => void
  /** True while a drag is over the zone; the adapter attaches utils/file-drop. */
  dragging?: boolean
  /** The canonical control props of an enclosing Field. */
  field?: Dict
}

/**
 * Choosing a file and the zone it is dropped into are one component: the zone
 * is the <label> of a real `input[type=file]`, so a press anywhere in it opens
 * the system dialog, Tab reaches it and Enter opens it.
 *
 * The input is taken away by a clip rather than by `display: none`: a field
 * hidden with display or visibility leaves the order of traversal, and the zone
 * stops being reachable from the keyboard. The call to action is the input's
 * accessible name, and the hint is read after it, because both are inside the
 * label.
 */
export function connect<T = Dict>(props: FileDropProps, normalize: Normalizer<T>, options: FileDropConnectOptions = {}) {
  const { name, accept, multiple, label = 'Drag files in or choose them', hint, disabled, required, invalid, files = [] } = props
  const { field, onFilesChange, dragging } = options
  const isDisabled = Boolean(disabled || field?.disabled)
  const isInvalid = Boolean(invalid || field?.['aria-invalid'] === 'true')

  const state = {
    'data-disabled': isDisabled ? '' : undefined,
    'data-invalid': isInvalid ? '' : undefined,
    'data-dragging': dragging ? '' : undefined,
  }

  const own: Dict = {
    ...anatomy.attrs('input'),
    type: 'file',
    name,
    accept,
    multiple: multiple || undefined,
    disabled: disabled || undefined,
    required: required || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    onInput: onFilesChange
      ? (event: Event) => onFilesChange([...((event.currentTarget as HTMLInputElement).files ?? [])])
      : undefined,
  }

  return {
    label,
    hint,
    files,
    showHint: Boolean(hint),
    showFiles: files.length > 0,
    filesText: files.join(', '),
    rootProps: normalize({ ...anatomy.attrs('root'), ...state }),
    iconProps: normalize({ ...anatomy.attrs('icon'), 'data-icon': 'upload', 'aria-hidden': 'true' }),
    inputProps: normalize(mergeProps(own, field)),
    textProps: normalize({ ...anatomy.attrs('text'), ...state }),
    hintProps: normalize({ ...anatomy.attrs('hint'), ...state }),
    filesProps: normalize({ ...anatomy.attrs('files'), ...state }),
  }
}
