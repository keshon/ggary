import { Button, Card, Cluster } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { runners } from '../../data/layout'

const RANKS = ['lead', 'default', 'support'] as const

export default function CardPage() {
  return (
    <DemoPage
      variants={
        <>
          {RANKS.map((rank) => (
            <Specimen key={rank} label={`rank="${rank}"`}>
              <Card title="Deployments" subtitle="Last 24 hours" rank={rank}>
                42 successful, 1 rolled back.
              </Card>
            </Specimen>
          ))}
          <Specimen label="plain">
            <Card title="Deployments" subtitle="Last 24 hours" plain>
              42 successful, 1 rolled back.
            </Card>
          </Specimen>
          {runners.map((runner) => (
            <Specimen key={runner.tone} label={`tone="${runner.tone}"`}>
              <Card title={runner.name} tone={runner.tone}>
                {runner.line}
              </Card>
            </Specimen>
          ))}
        </>
      }
      states={
        <>
          <Specimen label="interactive">
            <Card title="Queue" interactive onClick={() => {}}>
              Nothing waiting.
            </Card>
          </Specimen>
          <Specimen label="href">
            <Card title="Documentation" subtitle="docs.example.com" href="#/card">
              Setting up a runner.
            </Card>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="title">
            <Card title="Archive">Runs older than 90 days.</Card>
          </Specimen>
          <Specimen label="no title">
            <Card>Runs older than 90 days.</Card>
          </Specimen>
          <Specimen label="Cluster of Buttons inside">
            <Card title="runner-03" subtitle="Has not reported for 5 minutes" tone="warn">
              <Cluster gap="tight">
                <Button size="sm">Restart</Button>
                <Button size="sm" emphasis="minimal">
                  Logs
                </Button>
              </Cluster>
            </Card>
          </Specimen>
        </>
      }
    />
  )
}
