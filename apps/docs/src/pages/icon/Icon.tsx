import { Cluster, Grid, Icon, Text, iconNames } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES } from '../../data/display'
import { sampleGlyphs } from './data'

export default function IconPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="name · iconNames" wide>
            <Grid columns="tight" gap="tight">
              {iconNames.map((name) => (
                <Cluster key={name} gap="tight">
                  <Icon name={name} size="lg" />
                  <Text emphasis="low">{name}</Text>
                </Cluster>
              ))}
            </Grid>
          </Specimen>
          <Specimen label={`label="Failed"`}>
            <Icon name="status-error" size="lg" label="Failed" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          {sampleGlyphs.map((name) => (
            <Icon key={name} name={name} size={size} />
          ))}
        </Specimen>
      ))}
      composition={
        <>
          <Specimen label={`no size, inside Text tone="error"`}>
            <Text tone="error">
              <Icon name="status-warn" /> Build failed
            </Text>
          </Specimen>
          <Specimen label="defineIcons: rocket · planet">
            <Icon name="rocket" size="lg" />
            <Icon name="planet" size="lg" />
          </Specimen>
        </>
      }
    />
  )
}
