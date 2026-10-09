import { Avatar as Primitive } from '@base-ui/react/avatar'
import { connect, connectGroup, type AvatarGroupProps, type AvatarProps } from '@ggary/core/avatar'
import { reactNormalizer } from '@ggary/core'

export type { AvatarProps, AvatarGroupProps }

export function Avatar({ name, src, size, decorative }: AvatarProps) {
  const api = connect({ name, src, size, decorative }, reactNormalizer)
  return <Primitive.Root {...api.rootProps} data-backend="base-ui"
    render={(rootProps, state) => <span {...rootProps} data-status={src ? state.imageLoadingStatus : 'none'} />}>
    <Primitive.Fallback {...api.fallbackProps}>{api.initials}</Primitive.Fallback>
    {src && <Primitive.Image {...api.imageProps} keepMounted
      render={(imageProps, state) => <img {...imageProps} data-status={state.imageLoadingStatus} />} />}
  </Primitive.Root>
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
