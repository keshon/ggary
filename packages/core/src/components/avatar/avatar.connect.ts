import type { Dict, Normalizer } from '../../types'
import { avatarAnatomy } from './avatar.anatomy'
import type { AvatarGroupProps, AvatarImageStatus, AvatarProps } from './avatar.types'

/**
 * Up to two letters: the first of the first word and of the last. Letters, not
 * code units, so a name in any script, or one that starts with an emoji,
 * keeps whole characters.
 */
export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = (word: string) => Array.from(word)[0] ?? ''
  const letters = words.length === 1 ? first(words[0]) : first(words[0]) + first(words[words.length - 1])
  return letters.toLocaleUpperCase()
}

/**
 * Initials under an image. The image shows only once it has loaded, so a slow
 * or broken one leaves the initials rather than a gap or a broken-image glyph.
 * `status` is the adapter's: it watches the image's load and error events.
 */
export function connect<T = Dict>(props: AvatarProps & { status?: AvatarImageStatus }, normalize: Normalizer<T>) {
  const { name, src, size = 'md', decorative = false } = props
  const status: AvatarImageStatus = src ? (props.status ?? 'loading') : 'none'
  return {
    initials: avatarInitials(name),
    showImage: !!src && status !== 'error',
    rootProps: normalize({
      ...avatarAnatomy.attrs('root'),
      // Initials are read letter by letter; the name is what identifies.
      role: decorative ? undefined : 'img',
      'aria-label': decorative ? undefined : name,
      'aria-hidden': decorative ? 'true' : undefined,
      'data-size': size,
      'data-status': status,
    }),
    // The root carries the name; the image and the initials are its picture.
    imageProps: normalize({ ...avatarAnatomy.attrs('image'), src, alt: '', 'data-status': status }),
    fallbackProps: normalize({ ...avatarAnatomy.attrs('fallback'), 'aria-hidden': 'true' }),
  }
}

/** An overlapping row of avatars, with the ones past `max` counted as "+N". */
export function connectGroup<T = Dict>(props: AvatarGroupProps, normalize: Normalizer<T>) {
  const { label, people, max, size = 'md' } = props
  const limit = max === undefined ? people.length : Math.max(0, Math.min(max, people.length))
  const shown = limit < people.length ? people.slice(0, Math.max(0, limit)) : people
  const hidden = people.length - shown.length
  return {
    shown,
    hidden,
    groupProps: normalize({ ...avatarAnatomy.attrs('group'), role: 'group', 'aria-label': label, 'data-size': size }),
    // Real text, not decoration: how many more is data.
    moreProps: normalize({ ...avatarAnatomy.attrs('more'), 'data-size': size }),
    moreText: hidden > 0 ? `+${hidden}` : '',
  }
}
