import { useState } from 'react'
import { Tabs } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { openFiles, openFilesModified, panels, properties, propertiesWithPhysics } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

/** Closing a document tab asks the owner, who removes it. */
function Documents({ files }: { files: typeof openFiles }) {
  const [items, setItems] = useState(files)
  return <Tabs variant="documents" label="Open files" items={items} onClose={(value) => setItems(items.filter((item) => item.value !== value))} />
}

export default function TabsPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`variant="sections"`} wide>
            <Tabs label="Object properties" items={properties} />
          </Specimen>
          <Specimen label={`variant="documents"`} wide>
            <Documents files={openFiles} />
          </Specimen>
          <Specimen label={`orientation="vertical"`} wide>
            <Tabs label="Object properties" orientation="vertical" items={properties}>
              {(item) => <p>{panels[item.value]}</p>}
            </Tabs>
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Tabs label="Object properties" size={size} items={properties} />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled" wide>
            <Tabs label="Object properties" items={propertiesWithPhysics} />
          </Specimen>
          <Specimen label="modified" wide>
            <Documents files={openFilesModified} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="panels" wide>
          <Tabs label="Object properties" items={properties} defaultValue="material">
            {(item) => <p>{panels[item.value]}</p>}
          </Tabs>
        </Specimen>
      }
    />
  )
}
