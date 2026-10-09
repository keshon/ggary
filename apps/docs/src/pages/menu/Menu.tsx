import { useState } from 'react'
import { Button, ConfigProvider, Dialog, Menu, Popover } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { applyView, documentMenu, initialView, viewMenu } from '../../data/actions'

/** The view menu stays open as it is used: its toggles are the owner's, and it answers them. */
function ViewMenu() {
  const [view, setView] = useState(initialView)
  return (
    <Menu
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
      composition={
        <>
          <Specimen label="Base UI · actions + links + submenus">
            <Menu items={documentMenu} trigger={(props) => <Button {...props}>Document</Button>} />
          </Specimen>
          <Specimen label="Base UI · owner-controlled checkbox/radio">
            <ViewMenu />
          </Specimen>
          <Specimen label="Base UI · Dialog + Menu + local dark/RTL">
            <ConfigProvider mode="dark" dir="rtl">
              <Dialog title="Menu host" trigger={(props) => <Button {...props}>Open menu host</Button>}>
                <Menu items={documentMenu} trigger={(props) => <Button {...props}>Hosted actions</Button>} />
              </Dialog>
            </ConfigProvider>
          </Specimen>
          <Specimen label="Base UI · Popover + Menu">
            <Popover title="Actions host" trigger={(props) => <Button {...props}>Open actions popover</Button>}>
              <Menu items={documentMenu} trigger={(props) => <Button {...props}>Popover actions</Button>} />
            </Popover>
          </Specimen>
        </>
      }
    />
  )
}
