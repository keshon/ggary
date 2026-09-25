import { useEffect, useRef, useState } from 'react'
import { Menubar } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { appMenus, applyView, initialView } from '../../data/actions'
import { stageMnemonics, stageOpen } from './data'

/** The File menu opened once, as the page loads. Once only: StrictMode runs the effect twice, and a second press would close it. */
function useOpenFile() {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    requestAnimationFrame(() => host.current && stageOpen(host.current, 'file'))
  }, [])
  return host
}

export default function MenubarPage() {
  const [view, setView] = useState(initialView)
  const menus = appMenus(view)
  const onSelect = (value: string, { checked }: { checked?: boolean }) => setView(applyView(view, value, checked))
  const open = useOpenFile()
  useEffect(() => {
    requestAnimationFrame(stageMnemonics)
  }, [])

  return (
    <DemoPage
      states={
        <>
          <Specimen label="disabled" wide>
            <Menubar label="Application" menus={menus} onSelect={onSelect} />
          </Specimen>
          <Specimen label="mnemonics" wide>
            <Menubar label="Application" mnemonics menus={menus} onSelect={onSelect} />
          </Specimen>
          <Specimen label="open" wide>
            <div ref={open}>
              <Menubar label="Application" menus={menus} onSelect={onSelect} />
            </div>
          </Specimen>
        </>
      }
    />
  )
}
