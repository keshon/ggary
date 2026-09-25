import { Caret, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function CaretPage() {
  return (
    <DemoPage
      composition={
        <Specimen label="after the last character of streaming text">
          <Text>
            Streaming the answer
            <Caret />
          </Text>
        </Specimen>
      }
    />
  )
}
