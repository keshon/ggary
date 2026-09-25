import { Button, Failure, Turn } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { chatFailure, chatThread } from '../../data/agent'

const skipTheFile = <Button size="sm">Skip the file</Button>

export default function FailurePage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`state="pending"`} wide>
            <Failure {...chatFailure} state="pending" />
          </Specimen>
          <Specimen label={`state="resolved" resolvedAt`} wide>
            <Failure {...chatFailure} state="resolved" resolvedAt="14:05" />
          </Specimen>
          <Specimen label={`state="given-up" resolvedAt`} wide>
            <Failure {...chatFailure} state="given-up" resolvedAt="14:05" />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="no tried" wide>
            <Failure title="Could not reach registry.npmjs.org" code="ECONNRESET" reason="The connection was closed by the other side" />
          </Specimen>
          <Specimen label="actions" wide>
            <Failure {...chatFailure} actions={skipTheFile} />
          </Specimen>
          <Specimen label="in a Turn's after" wide>
            <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={<Failure {...chatFailure} actions={skipTheFile} />}>
              {chatThread.reading}
            </Turn>
          </Specimen>
        </>
      }
    />
  )
}
