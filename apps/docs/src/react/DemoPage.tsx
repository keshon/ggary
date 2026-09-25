import { useEffect, type ReactNode } from 'react'
import { SECTIONS, settlePage, type SectionKey } from '../site'

/**
 * Every page, the same shape: the sections it has, in the one order, each a
 * grid of specimens. A page only says what goes in each section.
 */
export function DemoPage(props: Partial<Record<SectionKey, ReactNode>>) {
  useEffect(settlePage, [])
  return (
    <>
      {SECTIONS.filter(({ key }) => props[key] !== undefined).map(({ key, title }) => (
        <section key={key} className="section" aria-labelledby={`section-${key}`}>
          <h2 className="section-title" id={`section-${key}`}>
            {title}
          </h2>
          <div className="specimens">{props[key]}</div>
        </section>
      ))}
    </>
  )
}

/** One specimen: the component on a stage, and the prop that made it. `wide` takes the whole row. */
export function Specimen({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <figure className="specimen" data-wide={wide ? '' : undefined}>
      <div className="specimen-stage">{children}</div>
      <figcaption className="specimen-label">{label}</figcaption>
    </figure>
  )
}
