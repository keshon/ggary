import { Button, Card, ConfigProvider, DatePicker, Input, List, ListItem, Metric, Stack } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { SIZES, english, german, outer, variants, type Labels } from './data'

/** The same few controls every time: only the settings around them change. */
function Controls({ text }: { text: Labels }) {
  return (
    <Card>
      <Stack>
        <Button>{text.save}</Button>
        <Input aria-label={text.name} placeholder={text.name} />
        <DatePicker label={text.due} defaultValue="2026-09-18" />
        <Metric label={text.leads} value={12400} />
        <List label={text.files} onLoadMore={() => {}}>
          <ListItem title={text.first} />
          <ListItem title={text.second} />
        </List>
      </Stack>
    </Card>
  )
}

export default function ConfigProviderPage() {
  return (
    <DemoPage
      variants={variants.map((sample) => (
        <Specimen key={sample.label} label={sample.label}>
          <ConfigProvider {...sample.config}>
            <Controls text={sample.text} />
          </ConfigProvider>
        </Specimen>
      ))}
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <ConfigProvider size={size}>
            <Controls text={english} />
          </ConfigProvider>
        </Specimen>
      ))}
      composition={
        <Specimen label={`size="sm" inside locale="de-DE" words`}>
          <ConfigProvider {...outer}>
            <ConfigProvider size="sm">
              <Controls text={german} />
            </ConfigProvider>
          </ConfigProvider>
        </Specimen>
      }
    />
  )
}
