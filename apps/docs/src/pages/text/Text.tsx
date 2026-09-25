import { Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { long, toned } from './data'

export default function TextPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`emphasis="medium"`}>
            <Text emphasis="medium">12 400 leads</Text>
          </Specimen>
          <Specimen label={`emphasis="low"`}>
            <Text emphasis="low">Updated 3 min ago</Text>
          </Specimen>
          <Specimen label="strong">
            <Text strong>12 400</Text>
          </Specimen>
          <Specimen label="code">
            <Text code>npm test</Text>
          </Specimen>
          <Specimen label="kbd">
            <Text kbd>Ctrl</Text> <Text kbd>K</Text>
          </Specimen>
          <Specimen label="mark">
            <Text mark>renewal</Text>
          </Specimen>
          <Specimen label="deleted">
            <Text deleted>$40</Text>
          </Specimen>
          {toned.map(([tone, word]) => (
            <Specimen key={tone} label={`tone="${tone}"`}>
              <Text tone={tone}>{word}</Text>
            </Specimen>
          ))}
        </>
      }
      states={
        <>
          <Specimen label="truncate">
            <Text truncate>{long}</Text>
          </Specimen>
          <Specimen label="truncate={2}">
            <Text truncate={2}>{long}</Text>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="in a line" wide>
            <span>
              <Text emphasis="low">Updated 3 min ago</Text> · <Text strong>12 400</Text> rows · press <Text kbd>Ctrl</Text> <Text kbd>K</Text> to
              find a <Text mark>renewal</Text> · <Text tone="error">3 failed</Text>
            </span>
          </Specimen>
          <Specimen label={`deleted · tone="ok"`}>
            <span>
              <Text deleted>$40</Text> <Text tone="ok">$32</Text>
            </span>
          </Specimen>
        </>
      }
    />
  )
}
