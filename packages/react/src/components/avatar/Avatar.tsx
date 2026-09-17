import { useState } from 'react'
import { connect, connectGroup, type AvatarGroupProps, type AvatarImageStatus, type AvatarProps } from '@ggary/core/avatar'
import { reactNormalizer } from '@ggary/core'

export type { AvatarProps, AvatarGroupProps }

export function Avatar({ name, src, size, decorative }: AvatarProps) {
  const [status, setStatus] = useState<AvatarImageStatus>(src ? 'loading' : 'none')
  // A new source starts over, decided during render rather than in an effect:
  // an effect runs after the commit, and could overwrite a load that already
  // arrived for the new image.
  const [shownSrc, setShownSrc] = useState(src)
  if (src !== shownSrc) {
    setShownSrc(src)
    setStatus(src ? 'loading' : 'none')
  }
  const api = connect({ name, src, size, decorative, status }, reactNormalizer)
  return (
    <span {...api.rootProps}>
      <span {...api.fallbackProps}>{api.initials}</span>
      {api.showImage && <img {...api.imageProps} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
    </span>
  )
}

export function AvatarGroup(props: AvatarGroupProps) {
  const api = connectGroup(props, reactNormalizer)
  return (
    <span {...api.groupProps}>
      {api.shown.map((person, index) => (
        <Avatar key={`${person.name}-${index}`} {...person} size={props.size} />
      ))}
      {api.hidden > 0 && <span {...api.moreProps}>{api.moreText}</span>}
    </span>
  )
}
