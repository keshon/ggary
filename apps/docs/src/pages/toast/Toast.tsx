import { useState } from 'react'
import { Button, Toaster } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { KINDS, pageToaster } from './data'

export default function ToastPage() {
  const [queue] = useState(pageToaster)
  return (
    <>
      <DemoPage
        variants={KINDS.map((kind) => (
          <Specimen key={kind.label} label={kind.label}>
            <Button emphasis="low" onClick={() => queue.toast(kind.toast)}>
              {kind.toast.title}
            </Button>
          </Specimen>
        ))}
      />
      <Toaster toaster={queue} />
    </>
  )
}
