import { Badge, Button, Icon, Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function ToolbarPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`label="Edit"`}>
            <Toolbar label="Edit">
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Cut">
                <Icon name="cut" />
              </ToolbarButton>
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Copy">
                <Icon name="copy" />
              </ToolbarButton>
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Paste">
                <Icon name="paste" />
              </ToolbarButton>
            </Toolbar>
          </Specimen>
          <Specimen label={`label="Zoom" orientation="vertical"`}>
            <Toolbar label="Zoom" orientation="vertical">
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Zoom in">
                <Icon name="zoom-in" />
              </ToolbarButton>
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Zoom out">
                <Icon name="zoom-out" />
              </ToolbarButton>
              <ToolbarSeparator />
              <ToolbarButton size="sm" emphasis="minimal" aria-label="Fit to screen">
                <Icon name="expand" />
              </ToolbarButton>
            </Toolbar>
          </Specimen>
          <Specimen label="no label">
            <Toolbar>
              <ToolbarButton size="sm" emphasis="low">Filter</ToolbarButton>
              <ToolbarButton size="sm" emphasis="low">Sort</ToolbarButton>
            </Toolbar>
          </Specimen>
        </>
      }
      states={
        <Specimen label="disabled">
          <Toolbar label="History">
            <ToolbarButton size="sm" emphasis="minimal" aria-label="Undo">
              <Icon name="undo" />
            </ToolbarButton>
            <ToolbarButton size="sm" emphasis="minimal" aria-label="Redo" disabled>
              <Icon name="redo" />
            </ToolbarButton>
          </Toolbar>
        </Specimen>
      }
      composition={
        <Specimen label="ToolbarSeparator · ToolbarSpacer" wide>
          <Toolbar label="Run tools">
            <ToolbarButton size="sm" emphasis="minimal">
              Filter
            </ToolbarButton>
            <ToolbarButton size="sm" emphasis="minimal">
              Sort
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton size="sm" emphasis="minimal">
              Export
            </ToolbarButton>
            <ToolbarSpacer />
            <Badge tone="running">7 running</Badge>
          </Toolbar>
        </Specimen>
      }
    />
  )
}
