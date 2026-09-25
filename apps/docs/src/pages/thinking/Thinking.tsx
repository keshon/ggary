import { Thinking, Turn } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { chatThread } from '../../data/agent'

export default function ThinkingPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label="duration={4.1}">
            <Thinking duration={4.1} locale="en-GB">
              {chatThread.reasoning}
            </Thinking>
          </Specimen>
          <Specimen label="no duration">
            <Thinking>{chatThread.reasoning}</Thinking>
          </Specimen>
          <Specimen label="streaming">
            <Thinking streaming>{chatThread.reasoning}</Thinking>
          </Specimen>
          <Specimen label="disabled">
            <Thinking duration={4.1} locale="en-GB" disabled>
              {chatThread.reasoning}
            </Thinking>
          </Specimen>
          <Specimen label="defaultOpen" wide>
            <Thinking duration={4.1} locale="en-GB" defaultOpen>
              {chatThread.reasoning}
            </Thinking>
          </Specimen>
          <Specimen label="streaming defaultOpen" wide>
            <Thinking streaming defaultOpen>
              {chatThread.reasoning}
            </Thinking>
          </Specimen>
        </>
      }
      composition={
        <Specimen label="in a Turn's before" wide>
          <Turn who="Agent" time="14:02" tokens={1284} duration={4.1} locale="en-GB" before={<Thinking duration={4.1} locale="en-GB">{chatThread.reasoning}</Thinking>}>
            {chatThread.answer}
          </Turn>
        </Specimen>
      }
    />
  )
}
