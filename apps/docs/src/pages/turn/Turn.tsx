import { Approval, Button, Composer, Failure, Icon, Stack, Thinking, Turn } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { chatApproval, chatFailure, chatThread } from '../../data/agent'

const answerActions = (
  <>
    <Button size="sm" emphasis="minimal" aria-label="Copy">
      <Icon name="copy" />
    </Button>
    <Button size="sm" emphasis="minimal" aria-label="Retry">
      <Icon name="refresh" />
    </Button>
    <Button size="sm" emphasis="minimal" aria-label="More">
      <Icon name="more" />
    </Button>
  </>
)

export default function TurnPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`from="user"`} wide>
            <Turn who="You" from="user">
              {chatThread.ask}
            </Turn>
          </Specimen>
          <Specimen label={`from="agent"`} wide>
            <Turn who="Agent" from="agent">
              {chatThread.answer}
            </Turn>
          </Specimen>
        </>
      }
      states={
        <Specimen label="streaming" wide>
          <Turn who="Agent" tokens={612} locale="en-GB" streaming>
            {chatThread.working}
          </Turn>
        </Specimen>
      }
      composition={
        <>
          <Specimen label="time tokens duration" wide>
            <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB">
              {chatThread.answer}
            </Turn>
          </Specimen>
          <Specimen label="before: Thinking · actions" wide>
            <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>} actions={answerActions}>
              {chatThread.answer}
            </Turn>
          </Specimen>
          <Specimen label="after: Failure" wide>
            <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={<Failure {...chatFailure} actions={<Button size="sm">Skip the file</Button>} />}>
              {chatThread.reading}
            </Turn>
          </Specimen>
          <Specimen label="a thread, with a Composer" wide>
            <Stack gap="loose">
              <Turn who="You" from="user" time="14:02">
                {chatThread.ask}
              </Turn>
              <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>} actions={answerActions}>
                {chatThread.answer}
              </Turn>
              <Turn who="Agent" time="14:04" duration={5.2} locale="en-GB" after={<Failure {...chatFailure} state="resolved" resolvedAt="14:05" />}>
                {chatThread.reading}
              </Turn>
              <Turn who="You" from="user" time="14:06">
                {chatThread.followUp}
              </Turn>
              <Turn
                who="Agent"
                time="14:06"
                tokens={612}
                locale="en-GB"
                before={<Thinking duration={2.4} locale="en-GB">{chatThread.reasoning}</Thinking>}
                after={<Approval {...chatApproval} live="assertive" />}
              >
                {chatThread.working}
              </Turn>
              <Composer label="Describe a task or ask a question" placeholder="Describe a task or ask a question" busy />
            </Stack>
          </Specimen>
        </>
      }
    />
  )
}
