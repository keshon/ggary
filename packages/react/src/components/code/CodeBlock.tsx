import type { HTMLAttributes } from 'react'
import { connect, type CodeBlockProps as CoreCodeBlockProps } from '@ggary/core/code'
import { reactNormalizer } from '@ggary/core'
import { useCopier } from '../../utils/use-copier'
import { useConfigured } from '../config-provider'

export interface CodeBlockProps extends CoreCodeBlockProps, Omit<HTMLAttributes<HTMLDivElement>, 'onCopy'> {}

export function CodeBlock(own: CodeBlockProps) {
  const { code, numbered, start, label, copyValue, onCopy, words, ...rest } = useConfigured(own, { words: 'codeBlock' })
  const [copy, runCopy] = useCopier()
  const api = connect({ code, numbered, start, label, copyValue, words, copy }, reactNormalizer, { onCopyPress: (): void =>
    runCopy(api.copyText, { onCopy, words }) })
  return (
    <div {...api.rootProps} {...rest}>
      <div {...api.contentProps}>
        {api.numbered
          ? api.lines.map((line) => (
              <div key={line.number} {...api.lineProps(line)}>
                <span {...api.lineNumberProps}>{line.number}</span>
                <span {...api.lineSourceProps}>{line.source}</span>
              </div>
            ))
          : code}
      </div>
      <button {...api.copyProps}>
        <span {...api.copyIconProps} />
      </button>
      <span {...api.liveProps}>{api.said}</span>
    </div>
  )
}
