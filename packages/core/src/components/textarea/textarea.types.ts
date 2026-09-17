export type TextareaSize = 'sm' | 'md' | 'lg'

/** Horizontal resizing is left out on purpose: it breaks every form layout. */
export type TextareaResize = 'vertical' | 'none'

export interface TextareaProps {
  size?: TextareaSize
  name?: string
  placeholder?: string
  /** The resting height in lines, and the floor an auto-resizing textarea shrinks to. */
  rows?: number
  minLength?: number
  maxLength?: number
  autoComplete?: string
  disabled?: boolean
  /** Readonly is not disabled; see InputProps. */
  readOnly?: boolean
  required?: boolean
  invalid?: boolean
  /** The user's resize handle. Defaults to vertical; auto-resize turns it off. */
  resize?: TextareaResize
  /** Grow and shrink with the content, from `rows` up to `maxRows`. */
  autoResize?: boolean
  maxRows?: number
}
