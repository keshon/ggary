import { Avatar, Cluster, Text, Timeline } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { boardEvents, dayEvents, reviewEvents, runEvents, withSeconds } from './data'

export default function TimelinePage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="tone on items" wide>
            <Timeline label="The nightly run" items={runEvents} locale="en-GB" />
          </Specimen>
          <Specimen label="no tone" wide>
            <Timeline label="Board history" items={boardEvents} locale="en-GB" />
          </Specimen>
          <Specimen label="timeFormat" wide>
            <Timeline label="The nightly run" items={runEvents} locale="en-GB" timeFormat={withSeconds} />
          </Specimen>
          <Specimen label="timeLabel" wide>
            <Timeline label="Invoice 2026-0915" items={dayEvents} locale="en-GB" />
          </Specimen>
        </>
      }
      composition={
        <Specimen label="rich body per item" wide>
          <Timeline label="Review" items={reviewEvents} locale="en-GB">
            {(item) => (
              <Cluster gap="tight">
                <Avatar name={item.id} size="sm" decorative />
                <Text strong>{item.id}</Text>
                <Text>{item.title}</Text>
              </Cluster>
            )}
          </Timeline>
        </Specimen>
      }
    />
  )
}
