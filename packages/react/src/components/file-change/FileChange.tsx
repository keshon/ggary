import { connect, type FileChangeProps as CoreFileChangeProps, type FileChangeWords } from '@ggary/core/file-change'
import { reactNormalizer } from '@ggary/core'

export interface FileChangeProps extends CoreFileChangeProps {
  /** What each change is called aloud, for another language. */
  words?: FileChangeWords
}

export function FileChange({ change, words }: FileChangeProps) {
  const api = connect({ change }, reactNormalizer, { words })
  return (
    <span {...api.rootProps}>
      <span {...api.signProps}>{api.sign}</span>
      <span {...api.labelProps}>{api.word}</span>
    </span>
  )
}
