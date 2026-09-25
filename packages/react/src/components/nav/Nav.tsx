import { useId, useState, type HTMLAttributes } from 'react'
import { connect, type NavItem, type NavProps as CoreNavProps } from '@ggary/core/nav'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface NavProps extends Omit<CoreNavProps, 'id'>, Omit<HTMLAttributes<HTMLElement>, 'children'> {}

/**
 * The side column. An item with `items` has sections one level down, opened
 * by the button beside it; which are open is kept here unless `open` is
 * given, and follows the reading until the reader sets it.
 */
export function Nav(own: NavProps) {
  const { label, groups, open, onOpenChange, numbered, words, ...rest } = useConfigured(own, { words: 'nav' })
  const id = `gg-nav-${useId().replace(/:/g, '')}`
  const [chosen, setChosen] = useState<Record<string, boolean>>({})
  const api = connect(
    {
      id,
      label,
      numbered,
      groups,
      words,
      open: open ?? chosen,
      onOpenChange: (href, next) => {
        if (open === undefined) setChosen((current) => ({ ...current, [href]: next }))
        onOpenChange?.(href, next)
      },
    },
    reactNormalizer
  )

  const link = (item: NavItem, level: 1 | 2) => {
    const parts = api.getItemProps(item, level)
    return (
      <a key={item.href} {...parts.itemProps}>
        {parts.showIcon && <span {...parts.iconProps} />}
        {item.label}
        {parts.showCount && <span {...parts.countProps}>{item.count}</span>}
      </a>
    )
  }

  return (
    <nav {...rest} {...api.rootProps}>
      {groups.map((group, index) => {
        const parts = api.getGroupProps(group, index)
        return (
          <div key={group.label ?? index} {...parts.groupProps}>
            {parts.showLabel && <span {...parts.groupLabelProps}>{group.label}</span>}
            {group.items.map((item) => {
              const branch = api.getBranchProps(item)
              if (!branch) return link(item, 1)
              return (
                <div key={item.href} {...branch.branchProps}>
                  {link(item, 1)}
                  <button {...branch.toggleProps}>
                    <span {...branch.toggleIconProps} />
                  </button>
                  <div {...branch.subitemsProps}>{branch.sections.map((section) => link(section, 2))}</div>
                </div>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
