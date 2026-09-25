import { Button, Result } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { outcomes } from './data'

export default function ResultPage() {
  return (
    <DemoPage
      variants={
        <>
          {outcomes.map(({ tone, title, description }) => (
            <Specimen key={title} label={tone ? `tone="${tone}"` : 'no tone'}>
              <Result tone={tone} title={title} description={description} />
            </Specimen>
          ))}
          <Specimen label={`code="404"`}>
            <Result code="404" title="Page not found" description="The link may be old, or the page moved." />
          </Specimen>
          <Specimen label={`tone="error" code="500"`}>
            <Result tone="error" code="500" title="Something broke" description="It is on our side. Try again in a minute." />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="actions · children" wide>
            <Result tone="ok" title="Payment sent" description="€420 to Acme GmbH. A receipt is on its way to finance@acme.example." actions={<Button emphasis="high">Back to invoices</Button>}>
              Reference 2026-0915-A
            </Result>
          </Specimen>
          <Specimen label={`code="404" · actions`} wide>
            <Result code="404" title="Page not found" description="The link may be old, or the page moved." actions={<Button>Go home</Button>} />
          </Specimen>
        </>
      }
    />
  )
}
