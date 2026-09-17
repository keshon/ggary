import type { Dict, Normalizer } from '../../types'
import type { AutosizeOptions } from '../../utils/autosize'
import { mergeProps } from '../../utils/merge-props'
import { textareaAnatomy } from './textarea.anatomy'
import type { TextareaProps } from './textarea.types'

export interface TextareaConnectOptions {
  /** Called with the new value on every edit. */
  onValueChange?: (value: string) => void
  /** The canonical control props of an enclosing Field; merged, as for Input. */
  field?: Dict
}

/**
 * Input's shape: no machine, the value lives in the native element. The one
 * behaviour a textarea adds is auto-resize, which needs the DOM; `autosize`
 * tells the adapter whether to attach core's `attachAutosize` and with what.
 */
export function connect<T = Dict>(props: TextareaProps, normalize: Normalizer<T>, options: TextareaConnectOptions = {}) {
  const {
    size = 'md', name, placeholder, rows, minLength, maxLength, autoComplete,
    disabled, readOnly, required, invalid, resize = 'vertical', autoResize, maxRows,
  } = props
  const { onValueChange, field } = options

  const own: Dict = {
    ...textareaAnatomy.attrs('root'),
    name,
    placeholder,
    rows,
    minLength,
    maxLength,
    autoComplete,
    disabled: disabled || undefined,
    readOnly: readOnly || undefined,
    required: required || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    'data-size': size,
    'data-invalid': invalid ? '' : undefined,
    // A handle that fights the auto height would be undone on the next keystroke.
    'data-resize': autoResize ? 'none' : resize,
    'data-autoresize': autoResize ? '' : undefined,
    onInput: onValueChange
      ? (event: Event) => onValueChange((event.currentTarget as HTMLTextAreaElement).value)
      : undefined,
  }

  return {
    autosize: autoResize ? ({ maxRows } satisfies AutosizeOptions) : null,
    rootProps: normalize(mergeProps(own, field)),
  }
}
