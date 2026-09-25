import { CodeBlock } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { command, generator } from './data'

export default function CodeBlockPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="code" wide>
            <CodeBlock label="the deploy command" code={command} />
          </Specimen>
          <Specimen label="numbered" wide>
            <CodeBlock label="the terrain generator" code={generator} numbered />
          </Specimen>
          <Specimen label="numbered start={12}" wide>
            <CodeBlock label="the terrain generator" code={generator} numbered start={12} />
          </Specimen>
        </>
      }
    />
  )
}
