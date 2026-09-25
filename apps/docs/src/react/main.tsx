import '../theme'
import '../site.css'

import { lazy, StrictMode, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, Nav, SegmentedControl } from '@ggary/react'
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
  useEffect(() => onRouteChange(setPage), [])
  useEffect(() => onModeChange(setShownMode), [])
  const Demo = useMemo(() => load(page.id), [page.id])

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
        <SegmentedControl label="Framework" size="sm" items={FRAMEWORKS} value="react" onValueChange={goToFramework} />
        <div className="bar-end">
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
        <Nav label="Components" numbered groups={navGroups(page)} />
      </aside>
      <main className="main">
        <article className="page" key={page.id}>
          <h1 className="page-title">{page.title}</h1>
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
