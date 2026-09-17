import { useId, type HTMLAttributes } from 'react'
import { connect, type NavProps as CoreNavProps } from '@ggary/core/nav'
import { reactNormalizer } from '@ggary/core'

export interface NavProps extends Omit<CoreNavProps, 'id'>, Omit<HTMLAttributes<HTMLElement>, 'children'> {}

export function Nav({ label, groups, ...rest }: NavProps) {
  const id = `gg-nav-${useId().replace(/:/g, '')}`
  const api = connect({ id, label, groups }, reactNormalizer)

  return (
    <nav {...rest} {...api.rootProps}>
      {groups.map((group, index) => {
        const parts = api.getGroupProps(group, index)
        return (
          <div key={group.label ?? index} {...parts.groupProps}>
            {parts.showLabel && <span {...parts.groupLabelProps}>{group.label}</span>}
            {group.items.map((item) => {
              const link = api.getItemProps(item)
              return (
                <a key={item.href} {...link.itemProps}>
                  {link.showIcon && <span {...link.iconProps} />}
                  {item.label}
                  {link.showCount && <span {...link.countProps}>{item.count}</span>}
                </a>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
