import { useState } from 'react'
import { Button, Toaster, createToaster } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { KINDS } from './data'

export default function ToastPage() {
  const [queue] = useState(() => { const queue = createToaster({ max: KINDS.length }); KINDS.forEach(kind => queue.toast(kind.toast)); return queue })
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
