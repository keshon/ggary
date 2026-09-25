import { Divider, Text } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

export default function DividerPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`emphasis="low"`}>
            <Divider />
          </Specimen>
          <Specimen label={`emphasis="medium"`}>
            <Divider emphasis="medium" />
          </Specimen>
          <Specimen label={`orientation="vertical"`}>
            <Text>Edit</Text>
            <Divider orientation="vertical" />
            <Text>Duplicate</Text>
            <Divider orientation="vertical" />
            <Text>Delete</Text>
          </Specimen>
          <Specimen label={`label="Advanced"`}>
            <Divider label="Advanced" />
          </Specimen>
          <Specimen label={`label="or" align="center"`}>
            <Divider label="or" align="center" />
          </Specimen>
          <Specimen label={`label="Danger zone" emphasis="medium"`}>
            <Divider label="Danger zone" emphasis="medium" />
          </Specimen>
        </>
      }
    />
  )
}
