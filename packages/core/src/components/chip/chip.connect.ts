import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { chipAnatomy } from './chip.anatomy'
import type { ChipProps } from './chip.types'

/**
 * The visual contract for a chip, shared by the standalone `Chip` and by every
 * chip `ChipGroup` renders.
 *
 * Splitting this out is what stops the group from growing its own divergent copy
 * of the chip's attributes — the same class of drift that let the vanilla Select
 * forget its empty state. One source, two callers.
 */
export function chipAttrs(props: ChipProps): Dict {
  const { emphasis = 'low', size = 'md', selected = false, disabled = false, removable = false } = props
  return {
    ...chipAnatomy.attrs('root'),
    'data-emphasis': emphasis,
    'data-size': size,
    'data-selected': selected ? '' : undefined,
    'data-disabled': disabled ? '' : undefined,
    'data-removable': removable ? '' : undefined,
  }
}

/**
 * Attributes for the dismiss affordance.
 *
 * It is deliberately NOT a button. A chip that is itself a <button> cannot
 * legally nest one, and two tab stops per chip wrecks roving tabindex. So the
 * "x" is a decorative pointer target, and `aria-keyshortcuts` advertises the
 * keyboard path that ChipGroup implements (Delete / Backspace).
 *
 * The tradeoff: a screen-reader user has to discover that shortcut. If your
 * chips are removable but NOT selectable, prefer a real <button> here and drop
 * the chip's own interactivity.
 */
export function chipRemoveAttrs(onRemove?: (event: any) => void): Dict {
  return {
    ...chipAnatomy.attrs('remove'),
    'aria-hidden': 'true',
    onClick: onRemove
      ? (event: MouseEvent) => {
          // The chip root is usually the click target's ancestor; without this the
          // same click would both remove and toggle.
          event.stopPropagation()
          event.preventDefault()
          onRemove(event)
        }
      : undefined,
  }
}

/**
 * The glyph inside the dismiss target, as a part of its own.
 *
 * It cannot live on `remove` itself: an icon is drawn as a CSS mask, a mask clips
 * everything on its element including pseudo-elements, and a theme may hang an
 * enlarged tap area on `remove::before`.
 */
export function chipRemoveIconAttrs(): Dict {
  return {
    ...chipAnatomy.attrs('remove-icon'),
    'data-icon': 'close' satisfies IconName,
    'aria-hidden': 'true',
  }
}

export function connect<T = Dict>(props: ChipProps, normalize: Normalizer<T>, options: { onRemove?: () => void } = {}) {
  const { onRemove } = options
  const { disabled = false, removable = false, interactive = false } = props

  return {
    rootProps: normalize({
      ...chipAttrs(props),
      ...(interactive
        ? {
            type: 'button',
            disabled: disabled || undefined,
            'aria-pressed': props.selected ? 'true' : 'false',
          }
        : {}),
      'aria-keyshortcuts': removable && interactive ? 'Delete' : undefined,
    }),
    labelProps: normalize({ ...chipAnatomy.attrs('label') }),
    removeProps: normalize(chipRemoveAttrs(onRemove && !disabled ? onRemove : undefined)),
    removeIconProps: normalize(chipRemoveIconAttrs()),
  }
}
