import { Badge, Button, Composer, Icon, Stack, Toolbar, ToolbarSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { chatThread } from '../../data/agent'
import { longDraft } from './data'

const field = { label: 'Describe a task or ask a question', placeholder: 'Describe a task or ask a question' }
const addContext = (
  <Button size="sm" emphasis="minimal" aria-label="Add context">
    <Icon name="plus" />
  </Button>
)

export default function ComposerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`bar="edge"`} wide>
            <Composer {...field} bar="edge" />
          </Specimen>
          <Specimen label={`bar="row"`} wide>
            <Composer {...field} bar="row">
              {addContext}
              <Button size="sm" emphasis="minimal" aria-label="Attach a file">
                <Icon name="attachment" />
              </Button>
            </Composer>
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="defaultValue" wide>
            <Composer {...field} defaultValue={chatThread.followUp} />
          </Specimen>
          <Specimen label="busy" wide>
            <Composer {...field} busy />
          </Specimen>
          <Specimen label="disabled" wide>
            <Composer {...field} disabled />
          </Specimen>
          <Specimen label="rows={3}" wide>
            <Composer {...field} rows={3} />
          </Specimen>
          <Specimen label="maxRows={4}" wide>
            <Composer {...field} maxRows={4} defaultValue={longDraft} />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="children · a Toolbar under it" wide>
          <Stack gap="tight">
            <Composer {...field} busy>
              {addContext}
            </Composer>
            <Toolbar label="Session">
              <Button size="sm" emphasis="minimal">
                Auto
              </Button>
              <Button size="sm" emphasis="minimal">
                Opus 5
              </Button>
              <ToolbarSpacer />
              <Badge tone="running">working</Badge>
              <Badge tone="warn">context 90%</Badge>
            </Toolbar>
          </Stack>
        </Specimen>
      }
    />
  )
}
