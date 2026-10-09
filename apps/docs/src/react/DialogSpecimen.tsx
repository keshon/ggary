import type { DialogProps } from '@ggary/react'

/** Visual specimen only; live interaction examples use the public Dialog. */
export function DialogSpecimen({ title, description, children, footer, size = 'md',
  placement = 'center', role = 'dialog', closeButton = true,
}: DialogProps) {
  const part = (name: string) => ({ 'data-scope': 'dialog', 'data-part': name })
  return <dialog {...part('content')} open data-size={size} data-placement={placement} role={role}>
    <header {...part('header')}>
      {title != null && <h2 {...part('title')}>{title}</h2>}
      {description != null && <p {...part('description')}>{description}</p>}
      {closeButton && <span {...part('close')} aria-hidden="true"><span {...part('close-icon')} data-icon="close" /></span>}
    </header>
    <div {...part('body')}><div className="select-pilot-layout">{children}</div></div>
    {footer != null && <footer {...part('footer')}>{footer}</footer>}
  </dialog>
}
