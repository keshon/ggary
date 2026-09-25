import { Button, Card, Field, Grid, Input, Section, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { tiles } from '../../data/layout'

const RANKS = ['lead', 'default', 'support'] as const

function Week() {
  return (
    <Grid columns="tight">
      {tiles.slice(0, 4).map((tile) => (
        <Card key={tile.title} title={tile.title} headingLevel={4}>
          {tile.value}
        </Card>
      ))}
    </Grid>
  )
}

function Details() {
  return (
    <Stack>
      <Field label="Signature">
        <Input defaultValue="Daria M., sales" />
      </Field>
      <Button emphasis="high">Save</Button>
    </Stack>
  )
}

export default function SectionPage() {
  return (
    <DemoPage
      variants={RANKS.map((rank) => (
        <Specimen key={rank} label={`rank="${rank}"`} wide>
          <Section title="This week" headingLevel={3} rank={rank}>
            <Week />
          </Section>
        </Specimen>
      ))}
      composition={
        <>
          <Specimen label="title · description" wide>
            <Section title="Your details" headingLevel={3} description="Shown to the leads you write to.">
              <Details />
            </Section>
          </Specimen>
          <Specimen label="title · actions" wide>
            <Section
              title="This week"
              headingLevel={3}
              actions={
                <Button size="sm" emphasis="minimal">
                  All weeks
                </Button>
              }
            >
              <Week />
            </Section>
          </Specimen>
          <Specimen label="Section after Section" wide>
            <Section title="This week" headingLevel={3}>
              <Week />
            </Section>
            <Section title="Your details" headingLevel={3} rank="support" description="Shown to the leads you write to.">
              <Details />
            </Section>
          </Specimen>
        </>
      }
    />
  )
}
