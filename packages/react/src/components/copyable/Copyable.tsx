import type { HTMLAttributes } from 'react'
import { connect, type CopyableProps as CoreCopyableProps } from '@ggary/core/copyable'
import { reactNormalizer } from '@ggary/core'
import { useCopier } from '../../utils/use-copier'
import { useConfigured } from '../config-provider'

export interface CopyableProps extends CoreCopyableProps, Omit<HTMLAttributes<HTMLSpanElement>, 'onCopy'> {}

export function Copyable(own: CopyableProps) {
  const { value, copyValue, onCopy, words, ...rest } = useConfigured(own, { words: 'copyable' })
  const [copy, runCopy] = useCopier()
  const api = connect({ value, copyValue, words, copy }, reactNormalizer, { onCopyPress: (): void => runCopy(api.copyText, { onCopy, words }) })
  return (
    <span {...api.rootProps} {...rest}>
      <code {...api.valueProps}>{value}</code>
      <button {...api.copyProps}>
        <span {...api.copyIconProps} />
      </button>
      <span {...api.liveProps}>{api.said}</span>
    </span>
  )
}
