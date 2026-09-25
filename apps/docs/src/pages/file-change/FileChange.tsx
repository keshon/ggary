import { Cluster, FileChange, Stack, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { changedFiles } from './data'

export default function FileChangePage() {
  return (
    <DemoPage
      variants={changedFiles.map(({ change, path }) => (
        <Specimen key={change} label={`change="${change}"`}>
          <Cluster gap="tight">
            <FileChange change={change} />
            <Text code>{path}</Text>
          </Cluster>
        </Specimen>
      ))}
      composition={
        <Specimen label="beside each path, in a list" wide>
          <Stack gap="tight">
            {changedFiles.map(({ change, path }) => (
              <Cluster key={path} gap="tight">
                <FileChange change={change} />
                <Text code>{path}</Text>
              </Cluster>
            ))}
          </Stack>
        </Specimen>
      }
    />
  )
}
