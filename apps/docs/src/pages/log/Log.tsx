import { useEffect, useState } from 'react'
import { Log } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { deployLines, nextLine, runLines } from './data'

/** Lines arriving, and the log holding the bottom as they do. */
function Arriving() {
  const [lines, setLines] = useState(() => Array.from({ length: 8 }, (_, index) => nextLine(index)))
  useEffect(() => {
    let count = 8
    const timer = setInterval(() => setLines((current) => [...current, nextLine(count++)].slice(-60)), 1200)
    return () => clearInterval(timer)
  }, [])
  return <Log lines={lines} label="The log of run 4127, arriving" locale="en-GB" tail style={{ maxBlockSize: 200 }} />
}

export default function LogPage() {
  return (
    <DemoPage
      states={
        <>
          <Specimen label={`level="info" · "debug" · "warn" · "error"`} wide>
            <Log lines={runLines} label="The log of run 4127" locale="en-GB" />
          </Specimen>
          <Specimen label={`timeZone="UTC" announce`} wide>
            <Log lines={deployLines} label="The deploy log" locale="en-GB" timeZone="UTC" announce />
          </Specimen>
          <Specimen label="lines={[]}" wide>
            <Log lines={[]} label="The log of run 4128" locale="en-GB" />
          </Specimen>
          <Specimen label="tail" wide>
            <Arriving />
          </Specimen>
        </>
      }
    />
  )
}
