import type { CopyWords } from '../../utils/copy'

export interface CodeBlockWords extends CopyWords {
  /** The name of the scrolling region, and what the copy button says it copies. */
  label: string
}

export interface CodeBlockProps {
  /** The text, lines split on `\n`. A trailing newline does not make an empty last line. */
  code: string
  /** A column of line numbers. They are read by eye and kept out of a selection and out of the copy. */
  numbered?: boolean
  /** The number of the first line, for an excerpt from the middle of a file. Default 1. */
  start?: number
  /** Names the block for a screen reader and for its copy button: "Copy the command". Default "Code". */
  label?: string
  /** Copy this rather than `code`. */
  copyValue?: string
  /** Called before the write. Return `false` to copy it yourself: the kit then writes nothing. */
  onCopy?: (text: string) => boolean | void
  words?: Partial<CodeBlockWords>
}
