import { useState } from 'react'
import { Nav } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { decoratedGroups, groups, withSections } from './data'

/** Opened by the reader, not by the reading: the sections stay open though none is current. */
function Opened() {
  const [open, setOpen] = useState<Record<string, boolean>>({ '#/menu': true })
  return <Nav label="Components" groups={withSections('#/button')} open={open} onOpenChange={(href, next) => setOpen({ ...open, [href]: next })} />
}

export default function NavPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="groups">
            <Nav label="Sections" groups={groups} />
          </Specimen>
          <Specimen label="icon · count">
            <Nav label="Sections" groups={decoratedGroups} />
          </Specimen>
          <Specimen label="numbered">
            <Nav label="Sections" numbered groups={groups} />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="items">
            <Nav label="Components" groups={withSections('#/button')} />
          </Specimen>
          <Specimen label="items · current">
            <Nav label="Components" groups={withSections('#/context-menu')} />
          </Specimen>
          <Specimen label="items · open">
            <Opened />
          </Specimen>
        </>
      }
    />
  )
}
