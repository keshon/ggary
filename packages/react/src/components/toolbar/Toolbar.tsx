import { createContext, useContext, forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { Toolbar as Primitive } from '@base-ui/react/toolbar'
import { connect, type ToolbarProps as CoreToolbarProps } from '@ggary/core/toolbar'
import { reactNormalizer } from '@ggary/core'
import { Button, type ButtonProps } from '../button/Button'

const ManagedToolbar = createContext(false)
export interface ToolbarProps extends CoreToolbarProps, HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}
export function Toolbar({ label, orientation = 'horizontal', children, ...rest }: ToolbarProps) {
  const api = connect({ label, orientation }, reactNormalizer)
  return <ManagedToolbar.Provider value={api.managed}>
    {api.managed ? <Primitive.Root {...rest} {...api.rootProps} orientation={orientation} data-backend="base-ui">{children}</Primitive.Root>
      : <div {...rest} {...api.rootProps}>{children}</div>}
  </ManagedToolbar.Provider>
}
/** Registered keyboard item. GGary Button supplies visuals and native button semantics. */
export const ToolbarButton = forwardRef<HTMLButtonElement, ButtonProps>(function ToolbarButton(props, ref) {
  const managed = useContext(ManagedToolbar)
  return managed ? <Primitive.Button ref={ref} disabled={props.disabled} focusableWhenDisabled={false}
    render={<Button {...props} />} /> : <Button {...props} ref={ref} />
})
export function ToolbarSeparator() {
  const api = connect({}, reactNormalizer)
  return <span {...api.separatorProps} />
}
export function ToolbarSpacer() {
  const api = connect({}, reactNormalizer)
  return <span {...api.spacerProps} />
}
