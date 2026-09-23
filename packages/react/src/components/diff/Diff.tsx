import type { HTMLAttributes } from 'react'
import { connect, type DiffProps as CoreDiffProps, type DiffWords } from '@ggary/core/diff'
import { reactNormalizer } from '@ggary/core'
import { FileChange } from '../file-change'

export interface DiffProps extends CoreDiffProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The diff's fixed text: the statistics, a folded stretch, the name of the body. */
  words?: DiffWords
}

export function Diff({ path, change, rows, before, after, context, locale, words, ...rest }: DiffProps) {
  const api = connect({ path, change, rows, before, after, context, locale }, reactNormalizer, words)
  return (
    <div {...rest} {...api.rootProps}>
      <div {...api.headProps}>
        {change !== undefined && <FileChange change={change} />}
        <span {...api.pathProps}>{path}</span>
        <span {...api.statProps}>
          <span {...api.addedProps}>{api.addedText}</span>
          <span {...api.removedProps}>{api.removedText}</span>
        </span>
      </div>
      <div {...api.bodyProps}>
        {api.rows.map((row) =>
          row.fold !== undefined ? (
            <div key={row.key} {...api.foldProps}>
              {row.fold}
            </div>
          ) : (
            <div key={row.key} {...row.rowProps}>
              {row.numbers.map((number, index) => (
                <span key={index} {...api.numProps}>
                  {number}
                </span>
              ))}
              <span {...api.codeProps}>{row.line!.text}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
