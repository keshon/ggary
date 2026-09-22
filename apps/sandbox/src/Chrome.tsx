import { useEffect, useRef, useState } from 'react'
import { Button, Nav, SegmentedControl } from '@ggary/react'
import { LOGO, PAGES, READING_ORDER, goToPage, navGroups, readingLabel, revealInList, watchBar, watchReading } from './page-chrome'
import { MODES, getMode, onModeChange, setMode, type Mode } from './theme'

const capital = (text: string) => text[0].toUpperCase() + text.slice(1)

/** The bar at the top: the mark and the name, the framework, the colour mode. */
export function Bar() {
  const [mode, setShown] = useState<Mode>(getMode)
  useEffect(() => onModeChange(setShown), [])
  useEffect(() => watchBar(), [])
  return (
    <>
      <a className="brand" href="#top" aria-label="GGary UI, to the top">
        <span className="brand-mark" dangerouslySetInnerHTML={{ __html: LOGO }} />
        <span className="wordmark">GGary</span>
      </a>
      <SegmentedControl label="Framework" size="sm" items={PAGES} value="react" onValueChange={goToPage} />
      <div className="theme-controls">
        <SegmentedControl label="Colour mode" size="sm" items={MODES.map((value) => ({ value, label: capital(value) }))} value={mode} onValueChange={(value) => setMode(value as Mode)} />
      </div>
    </>
  )
}

/**
 * The navigator: the page's map — categories, components, their variants —
 * with the one being read marked, and its component opened. A column at the
 * page's left edge where there is room; elsewhere a popover opened from a
 * button at the corner that says where you are.
 */
export function Navigator() {
  const [reading, setReading] = useState(0)
  const list = useRef<HTMLElement>(null)
  useEffect(() => watchReading(READING_ORDER.map((entry) => entry.anchor), setReading), [])
  useEffect(() => revealInList(list.current), [reading])
  const current = READING_ORDER[reading]
  return (
    <>
      <aside
        id="toc"
        className="toc"
        ref={list}
        popover=""
        onClick={(event) => {
          const toc = event.currentTarget
          if ((event.target as Element).closest('a') && toc.matches(':popover-open')) toc.hidePopover()
        }}
      >
        <Nav label="Components" groups={navGroups(current?.anchor ?? null)} />
      </aside>
      <div className="toc-button">
        <Button emphasis="high" popoverTarget="toc">
          <span data-icon="list" aria-hidden="true" />
          <span className="visually-hidden">Components: </span>
          <span className="toc-current">{readingLabel(current)}</span>
        </Button>
      </div>
    </>
  )
}
