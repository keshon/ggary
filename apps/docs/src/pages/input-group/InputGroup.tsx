import { Button, Field, Icon, Input, InputGroup } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'

const SIZES = ['sm', 'md', 'lg'] as const

export default function InputGroupPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`prefix="$"`}>
            <InputGroup prefix="$">
              <Input type="number" aria-label="Budget, dollars" defaultValue="12" min={0} />
            </InputGroup>
          </Specimen>
          <Specimen label={`suffix=".example.com"`}>
            <InputGroup suffix=".example.com">
              <Input aria-label="Subdomain" defaultValue="worldbox" />
            </InputGroup>
          </Specimen>
          <Specimen label={`prefix="$" suffix="per hour"`}>
            <InputGroup prefix="$" suffix="per hour">
              <Input type="number" aria-label="Budget, dollars an hour" defaultValue="12" min={0} />
            </InputGroup>
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <InputGroup size={size} prefix="$" suffix="per hour">
            <Input size={size} type="number" aria-label={`Budget, ${size}`} defaultValue="12" min={0} />
          </InputGroup>
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled">
            <InputGroup disabled suffix=".example.com">
              <Input disabled aria-label="Subdomain" defaultValue="worldbox" />
            </InputGroup>
          </Specimen>
          <Specimen label="invalid">
            <InputGroup invalid suffix=".example.com">
              <Input invalid aria-label="Subdomain" defaultValue="world box" />
            </InputGroup>
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="in a Field">
            <Field label="Budget" hint="Per agent, in dollars an hour">
              <InputGroup prefix="$" suffix="per hour">
                <Input type="number" defaultValue="12" min={0} />
              </InputGroup>
            </Field>
          </Specimen>
          <Specimen label="Button after the Input">
            <InputGroup prefix="https://">
              <Input readOnly aria-label="Share link" defaultValue="atlas.dev/r/41" />
              <Button emphasis="low" aria-label="Copy link">
                <Icon name="copy" />
              </Button>
            </InputGroup>
          </Specimen>
        </>
      }
    />
  )
}
