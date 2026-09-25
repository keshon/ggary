import { Approval, Button, Turn } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { chatApproval, chatThread } from '../../data/agent'

const alwaysAllow = (
  <Button size="sm" emphasis="minimal">
    Always allow
  </Button>
)

export default function ApprovalPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`state="pending"`} wide>
            <Approval {...chatApproval} state="pending" />
          </Specimen>
          <Specimen label={`state="approved" decidedBy decidedAt`} wide>
            <Approval {...chatApproval} state="approved" decidedBy="You" decidedAt="14:07" />
          </Specimen>
          <Specimen label={`state="denied" decidedBy decidedAt`} wide>
            <Approval {...chatApproval} state="denied" decidedBy="You" decidedAt="14:07" />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="title · no effects" wide>
            <Approval what="git push --force origin main" title="Rewrite the history of main?" />
          </Specimen>
          <Specimen label="actions" wide>
            <Approval {...chatApproval} actions={alwaysAllow} />
          </Specimen>
          <Specimen label="in a Turn's after" wide>
            <Turn who="Agent" time="14:06" tokens={612} locale="en-GB" after={<Approval {...chatApproval} live="assertive" actions={alwaysAllow} />}>
              {chatThread.working}
            </Turn>
          </Specimen>
        </>
      }
    />
  )
}
