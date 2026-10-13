import '../theme'
import '../site.css'
import { implementationFor, implementationBadge } from './implementation'

import { lazy, StrictMode, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Nav, Search, SegmentedControl } from '@ggary/react'
import { FRAMEWORKS, LOGO, currentPage, goToFramework, navGroups, onRouteChange } from '../site'
import { MODES, getMode, onModeChange, setMode, type Mode } from '../theme'

/** Each page's React demo, loaded when it is first read. */
const demos = import.meta.glob<{ default: ComponentType }>('../pages/*/*.tsx')
const load = (id: string) => {
  const entry = Object.entries(demos).find(([path]) => path.startsWith(`../pages/${id}/`))
  return entry ? lazy(entry[1]) : null
}

const capital = (text: string) => text[0].toUpperCase() + text.slice(1)

function App() {
  const [page, setPage] = useState(currentPage)
  const [mode, setShownMode] = useState<Mode>(getMode)
  const [navigationQuery, setNavigationQuery] = useState('')
  const navigationSearch = useRef<HTMLInputElement>(null)
  const showNarrowNavigation = () => {
    const side = document.getElementById('side')
    if (side && getComputedStyle(side).display === 'none') side.showPopover()
  }
  useEffect(() => onRouteChange(setPage), [])
  useEffect(() => onModeChange(setShownMode), [])
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      if ((event.target as Element | null)?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      showNarrowNavigation()
      navigationSearch.current?.focus()
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])
  const implementation = implementationFor(page.id)
  const Demo = useMemo(() => load(page.id), [page.id])
  const groups = useMemo(() => navGroups(page, navigationQuery), [page, navigationQuery])

  return (
    <div className="site">
      <header className="bar">
        <Button className="nav-button" size="sm" emphasis="low" aria-label="Components" popoverTarget="side">
          <span data-icon="menu" aria-hidden="true" />
        </Button>
        <a className="brand" href="#/">
          <span className="brand-mark" dangerouslySetInnerHTML={{ __html: LOGO }} />
          GGary
        </a>
        <div className="bar-search" onFocus={showNarrowNavigation}>
          <Search
            ref={navigationSearch}
            size="sm"
            label="Search components"
            placeholder="Search components…"
            value={navigationQuery}
            onValueChange={setNavigationQuery}
            onClick={showNarrowNavigation}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && navigationQuery) {
                event.preventDefault()
                setNavigationQuery('')
              }
            }}
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div className="bar-end">
          <SegmentedControl label="Framework" size="sm" items={FRAMEWORKS} value="react" onValueChange={goToFramework} />
          <SegmentedControl label="Colour mode" size="sm" items={MODES.map((value) => ({ value, label: capital(value) }))} value={mode} onValueChange={(value) => setMode(value as Mode)} />
        </div>
      </header>
      <aside
        className="side"
        id="side"
        popover=""
        onClick={(event) => {
          const side = event.currentTarget
          if ((event.target as Element).closest('a') && side.matches(':popover-open')) side.hidePopover()
        }}
      >
        {groups.length ? (
          <Nav label="Components" numbered={!navigationQuery.trim()} groups={groups} />
        ) : (
          <p className="side-empty" role="status">No components found</p>
        )}
      </aside>
      <main className="main">
        <article className="page" key={page.id}>
          <h1 className="page-title">{page.title}</h1>
          <aside className="component-guidance" aria-label="Component information">
            <span className="implementation-badge">{implementationBadge(implementation.label)}</span>
          </aside>
          <Suspense fallback={null}>{Demo && <Demo />}</Suspense>
        </article>
      </main>
    </div>
  )
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
