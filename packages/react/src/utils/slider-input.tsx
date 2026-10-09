import { Children, Fragment, cloneElement, isValidElement, type InputHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { mergeProps } from '@ggary/core'

/** Add GGary input metadata without replacing Base UI refs, values or interaction handlers. */
export function sliderInput(children: ReactNode, attributes: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    if (child.type === Fragment) {
      const fragment = child as ReactElement<{ children?: ReactNode }>
      return cloneElement(fragment, {}, sliderInput(fragment.props.children, attributes))
    }
    if (child.type !== 'input') return child
    const input = child as ReactElement<InputHTMLAttributes<HTMLInputElement>>
    return cloneElement(input, mergeProps(input.props, attributes))
  })
}
