import { connect, type FileChangeProps as CoreFileChangeProps, type FileChangeWords } from '@ggary/core/file-change'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface FileChangeProps extends CoreFileChangeProps {
  /** What each change is called aloud, for another language. */
  words?: FileChangeWords
}

export function FileChange(own: FileChangeProps) {
  const { change, words } = useConfigured(own, { words: 'fileChange' })
  const api = connect({ change }, reactNormalizer, { words })
  return (
    <span {...api.rootProps}>
      <span {...api.signProps}>{api.sign}</span>
      <span {...api.labelProps}>{api.word}</span>
    </span>
  )
}
