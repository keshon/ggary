import { Button, EmptyState, Panel } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function EmptyStatePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="title">
            <EmptyState title="No runs yet" />
          </Specimen>
          <Specimen label="title · description">
            <EmptyState title="Nothing matches “worldgen”" description="Try a shorter word, or clear the filter." />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="children: one Button">
            <EmptyState title="No runs yet" description="A run starts on every push to main.">
              <Button emphasis="low" size="sm">
                Start a run
              </Button>
            </EmptyState>
          </Specimen>
          <Specimen label="inside a Panel" wide>
            <Panel title="Artifacts">
              <EmptyState title="No artifacts yet" description="Artifacts appear here after the first successful build.">
                <Button emphasis="low" size="sm">
                  Start a build
                </Button>
              </EmptyState>
            </Panel>
          </Specimen>
        </>
      }
    />
  )
}
