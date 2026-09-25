import { Button, Card, Field, Input, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { gaps, tiles } from '../../data/layout'

export default function StackPage() {
  return (
    <DemoPage
      variants={gaps.map((gap) => (
        <Specimen key={gap} label={`gap="${gap}"`}>
          <Stack gap={gap}>
            {tiles.slice(0, 2).map((tile) => (
              <Card key={tile.title} title={tile.title}>
                {tile.value}
              </Card>
            ))}
            <Button emphasis="low">All weeks</Button>
          </Stack>
        </Specimen>
      ))}
      composition={
        <Specimen label="Field · Field · Button" wide>
          <Stack>
            <Field label="Name">
              <Input defaultValue="Daria M." />
            </Field>
            <Field label="Signature">
              <Input defaultValue="Daria M., sales" />
            </Field>
            <Button emphasis="high">Save</Button>
          </Stack>
        </Specimen>
      }
    />
  )
}
