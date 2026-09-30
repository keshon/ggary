import type { RibbonItem } from '@ggary/core/ribbon'
import { Fragment } from 'react'
import { Button, Icon, Ribbon, RibbonGroup, RibbonSeparator, RibbonTool, SegmentedControl, Select } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { levels, overflowGroups, sceneTabs, sceneTabsWithLocked, snapModes, toolTabs } from './data'

function ScenePanel({ item }: { item: RibbonItem }) {
  if (item.value === 'modify') {
    return (
      <>
        <RibbonGroup label="Deform">
          <Button size="sm" emphasis="minimal" aria-label="Bend">
            <Icon name="edit" />
          </Button>
          <Button size="sm" emphasis="minimal" aria-label="Twist">
            <Icon name="redo" />
          </Button>
          <Button size="sm" emphasis="minimal" aria-label="Taper">
            <Icon name="filter" />
          </Button>
        </RibbonGroup>
        <RibbonSeparator />
        <RibbonGroup label="Snap">
          <SegmentedControl size="sm" label="Snap" items={snapModes} defaultValue="grid" />
        </RibbonGroup>
      </>
    )
  }
  if (item.value === 'animate') {
    return (
      <>
        <RibbonGroup label="Playback">
          <Button size="sm" emphasis="minimal" aria-label="Play">
            <Icon name="play" />
          </Button>
          <Button size="sm" emphasis="minimal" aria-label="Stop">
            <Icon name="stop" />
          </Button>
          <Button size="sm" emphasis="minimal" aria-label="Skip">
            <Icon name="skip" />
          </Button>
        </RibbonGroup>
        <RibbonSeparator />
        <RibbonGroup label="Range">
          <Select size="sm" label="Range" items={levels} defaultValue="mid" />
        </RibbonGroup>
      </>
    )
  }
  return (
    <>
      <RibbonGroup label="Create">
        <Button size="sm" emphasis="minimal" aria-label="Box">
          <Icon name="grid" />
        </Button>
        <Button size="sm" emphasis="minimal" aria-label="Sphere">
          <Icon name="globe" />
        </Button>
        <Button size="sm" emphasis="minimal" aria-label="Cylinder">
          <Icon name="database" />
        </Button>
      </RibbonGroup>
      <RibbonSeparator />
      <RibbonGroup label="Level">
        <Select size="sm" label="Level" items={levels} defaultValue="base" />
      </RibbonGroup>
      <RibbonSeparator />
      <RibbonGroup label="History">
        <Button size="sm" emphasis="minimal" aria-label="Undo">
          <Icon name="undo" />
        </Button>
        <Button size="sm" emphasis="minimal" aria-label="Redo">
          <Icon name="redo" />
        </Button>
      </RibbonGroup>
    </>
  )
}

export default function RibbonPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`label="Scene tools"`} wide>
            <Ribbon label="Scene tools" items={sceneTabs} defaultValue="model">
              {(item) => <ScenePanel item={item} />}
            </Ribbon>
          </Specimen>
          <Specimen label={`variant="cards"`} wide>
            <Ribbon label="Scene tools" variant="cards" items={sceneTabs} defaultValue="model">
              {(item) => <ScenePanel item={item} />}
            </Ribbon>
          </Specimen>
        </>
      }
      states={
        <Specimen label="disabled tab" wide>
          <Ribbon label="Scene tools" items={sceneTabsWithLocked} defaultValue="model">
            {(item) => <ScenePanel item={item} />}
          </Ribbon>
        </Specimen>
      }
      composition={
        <>
          <Specimen label="mixed controls" wide>
            <Ribbon label="Scene tools" items={sceneTabs} defaultValue="modify">
              {(item) => <ScenePanel item={item} />}
            </Ribbon>
          </Specimen>
          <Specimen label="RibbonTool" wide>
            <Ribbon label="Scene tools" variant="cards" items={sceneTabs} defaultValue="model">
              {(item) =>
                item.value === 'model' ? (
                  <>
                    <RibbonGroup label="Create">
                      <RibbonTool>
                        <Button size="sm" emphasis="minimal">
                          <Icon name="grid" size="lg" />
                          Box
                        </Button>
                      </RibbonTool>
                      <RibbonTool>
                        <Button size="sm" emphasis="minimal">
                          <Icon name="globe" size="lg" />
                          Sphere
                        </Button>
                      </RibbonTool>
                      <RibbonTool>
                        <Button size="sm" emphasis="minimal">
                          <Icon name="database" size="lg" />
                          Cylinder
                        </Button>
                      </RibbonTool>
                    </RibbonGroup>
                    <RibbonSeparator />
                    <RibbonGroup label="Level">
                      <Select size="sm" label="Level" items={levels} defaultValue="base" />
                    </RibbonGroup>
                  </>
                ) : (
                  <ScenePanel item={item} />
                )
              }
            </Ribbon>
          </Specimen>
          <Specimen label="overflow" wide>
            <Ribbon label="Many tools" items={toolTabs} defaultValue="tools">
              {() => (
                <>
                  {overflowGroups.map((group, index) => (
                    <Fragment key={group.label}>
                      {index > 0 && <RibbonSeparator />}
                      <RibbonGroup label={group.label}>
                        {group.tools.map((tool) => (
                          <Button key={tool.name} size="sm" emphasis="minimal" aria-label={tool.name}>
                            <Icon name={tool.icon} />
                          </Button>
                        ))}
                      </RibbonGroup>
                    </Fragment>
                  ))}
                </>
              )}
            </Ribbon>
          </Specimen>
        </>
      }
    />
  )
}
