import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type StepProps as CoreStepProps, type StepWords } from '@ggary/core/step'
import { reactNormalizer } from '@ggary/core'
import { Caret, StatusDot } from '../states'

export interface StepProps extends CoreStepProps, Omit<HTMLAttributes<HTMLElement>, 'children' | 'onToggle'> {
  /** The step's fixed text: the phases in words, the button over a cut output, the units of time. */
  words?: StepWords
  /** What the tool was called with: the arguments, as they were sent. */
  children?: ReactNode
  /** What came back. */
  output?: ReactNode
}

export function Step({
  name,
  argument,
  state,
  detail,
  duration,
  locale,
  defaultOpen,
  outputLines,
  onShowAll,
  streaming,
  onOpenChange,
  words,
  children,
  output,
  ...rest
}: StepProps) {
  const api = connect(
    { name, argument, state, detail, duration, locale, defaultOpen, outputLines, onShowAll, streaming, onOpenChange },
    reactNormalizer,
    { words })
  const hasOutput = output !== undefined || api.truncated
  return (
    <details {...rest} {...api.rootProps}>
      <summary {...api.headProps}>
        <span {...api.indicatorProps} />
        <StatusDot />
        <span {...api.nameProps}>{name}</span>
        {argument !== undefined && <span {...api.argumentProps}>{argument}</span>}
        {api.meta !== '' && <span {...api.metaProps}>{api.meta}</span>}
        <span {...api.statusProps}>{api.status}</span>
      </summary>
      <div {...api.bodyProps}>
        {children}
        {hasOutput && (
          <div {...api.outputProps}>
            <div {...api.outputBodyProps}>
              {output}
              {api.showCaret && <Caret />}
            </div>
            {api.truncated && (
              <button {...api.moreProps}>{api.showAllLabel}</button>
            )}
          </div>
        )}
      </div>
    </details>
  )
}
