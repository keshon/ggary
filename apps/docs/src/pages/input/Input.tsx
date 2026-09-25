import { useEffect, useRef, type ReactNode } from 'react'
import { Field, Input, InputGroup } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { inputTypes } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

/** The password shown as it loads: its reveal button pressed once. StrictMode runs the effect twice, so once only. */
function Revealed({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null)
  const staged = useRef(false)
  useEffect(() => {
    if (staged.current) return
    staged.current = true
    host.current?.querySelector<HTMLButtonElement>('[data-part="reveal"]')?.click()
  }, [])
  return <div ref={host}>{children}</div>
}

export default function InputPage() {
  return (
    <DemoPage
      variants={
        <>
          {inputTypes.map(({ type, name, placeholder, defaultValue }) => (
            <Specimen key={type} label={`type="${type}"`}>
              <Input type={type} aria-label={name} placeholder={placeholder} defaultValue={defaultValue} />
            </Specimen>
          ))}
          <Specimen label={`type="password" reveal={false}`}>
            <Input type="password" reveal={false} aria-label="PIN" defaultValue="2041" />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`}>
          <Input size={size} aria-label={`Full name, ${size}`} placeholder="Anna Petrova" />
        </Specimen>
      ))}
      states={
        <>
          <Specimen label="disabled">
            <Input disabled aria-label="Company" defaultValue="Atlas Ltd" />
          </Specimen>
          <Specimen label="readOnly">
            <Input readOnly aria-label="Invoice" defaultValue="INV-2041" />
          </Specimen>
          <Specimen label="invalid">
            <Input invalid type="email" aria-label="Email" defaultValue="anna@" />
          </Specimen>
          <Specimen label="required, in a Field">
            <Field label="Email" required>
              <Input type="email" placeholder="you@example.com" />
            </Field>
          </Specimen>
          <Specimen label={`type="password": revealed`}>
            <Revealed>
              <Input type="password" aria-label="Password" defaultValue="atlas-2041" />
            </Revealed>
          </Specimen>
          <Specimen label={`type="password" disabled`}>
            <Input type="password" disabled aria-label="Password" defaultValue="atlas-2041" />
          </Specimen>
        </>
      }
      composition={
        <>
          <Specimen label="in a Field">
            <Field label="Full name" hint="As it appears on your ID">
              <Input autoComplete="name" />
            </Field>
          </Specimen>
          <Specimen label="in an InputGroup">
            <InputGroup suffix=".example.com">
              <Input aria-label="Subdomain" defaultValue="worldbox" />
            </InputGroup>
          </Specimen>
        </>
      }
    />
  )
}
