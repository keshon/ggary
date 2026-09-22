import type { CopyWords } from '../../utils/copy'

export interface CopyableProps {
  /** The value as shown: a hash, a path, an identifier. One line. */
  value: string
  /** Copy this rather than `value` — the full hash behind an abbreviation. */
  copyValue?: string
  /** Called before the write. Return `false` to copy it yourself: the kit then writes nothing. */
  onCopy?: (text: string) => boolean | void
  words?: Partial<CopyWords>
}
