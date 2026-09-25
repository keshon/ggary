import { useState } from 'react'
import { Button, Menu } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { applyView, documentMenu, initialView, viewMenu } from '../../data/actions'

/** The view menu stays open as it is used: its toggles are the owner's, and it answers them. */
function ViewMenu() {
  const [view, setView] = useState(initialView)
  return (
    <Menu
      defaultOpen
      label="View options"
      closeOnSelect={false}
      items={viewMenu(view)}
      onSelect={(value, { checked }) => setView(applyView(view, value, checked))}
      trigger={(props) => (
        <Button emphasis="low" {...props}>
          View
        </Button>
      )}
    />
  )
}

export default function MenuPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label="defaultOpen">
            <Menu defaultOpen items={documentMenu} trigger={(props) => <Button {...props}>Document</Button>} />
          </Specimen>
          <Specimen label="defaultOpen closeOnSelect={false}">
            <ViewMenu />
          </Specimen>
        </>
      }
    />
  )
}
