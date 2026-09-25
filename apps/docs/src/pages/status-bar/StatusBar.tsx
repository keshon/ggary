import { Button, Icon, StatusBar, StatusBarItem, StatusBarSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { readings } from './data'

export default function StatusBarPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="StatusBarItem">
            <StatusBar>
              <StatusBarItem>Ln 12, Col 4</StatusBarItem>
            </StatusBar>
          </Specimen>
          {readings.map(([tone, word]) => (
            <Specimen key={tone} label={`StatusBarItem tone="${tone}"`}>
              <StatusBar>
                <StatusBarItem tone={tone}>{word}</StatusBarItem>
              </StatusBar>
            </Specimen>
          ))}
        </>
      }
      composition={
        <>
          <Specimen label="StatusBarSpacer · Button" wide>
            <StatusBar label="Workspace status">
              <StatusBarItem>Synced 2 min ago</StatusBarItem>
              <StatusBarItem tone="error">3 failed saves</StatusBarItem>
              <StatusBarSpacer />
              <StatusBarItem>700,000 leads</StatusBarItem>
              <Button size="sm" emphasis="minimal">
                Sync
              </Button>
            </StatusBar>
          </Specimen>
          <Specimen label="Icon in a StatusBarItem" wide>
            <StatusBar label="Editor status">
              <StatusBarItem>
                <Icon name="code" /> main
              </StatusBarItem>
              <StatusBarItem tone="warn">
                <Icon name="status-warn" /> 2 warnings
              </StatusBarItem>
              <StatusBarSpacer />
              <StatusBarItem>
                <Icon name="cloud" /> Saved
              </StatusBarItem>
            </StatusBar>
          </Specimen>
        </>
      }
    />
  )
}
