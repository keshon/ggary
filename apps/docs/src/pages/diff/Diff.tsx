import { Diff } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { filtersAfter, filtersBefore } from '../../data/agent'
import { addedTest, patchRows, removedHelper, renamedAfter, renamedBefore } from './data'

const path = 'src/grid/filters.ts'

export default function DiffPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label={`change="modified"`} wide>
            <Diff path={path} change="modified" before={filtersBefore} after={filtersAfter} locale="en-GB" />
          </Specimen>
          <Specimen label={`change="added"`} wide>
            <Diff path="src/grid/filters.test.ts" change="added" before="" after={addedTest} locale="en-GB" />
          </Specimen>
          <Specimen label={`change="deleted"`} wide>
            <Diff path="src/grid/blank.ts" change="deleted" before={removedHelper} after="" locale="en-GB" />
          </Specimen>
          <Specimen label={`change="renamed"`} wide>
            <Diff path="src/grid/match-row.ts" change="renamed" before={renamedBefore} after={renamedAfter} locale="en-GB" />
          </Specimen>
          <Specimen label={`change="conflict"`} wide>
            <Diff path={path} change="conflict" rows={patchRows} locale="en-GB" />
          </Specimen>
          <Specimen label="no change" wide>
            <Diff path={path} before={filtersBefore} after={filtersAfter} locale="en-GB" />
          </Specimen>
        </>
      }
      states={
        <>
          <Specimen label="context={1}" wide>
            <Diff path={path} change="modified" before={filtersBefore} after={filtersAfter} context={1} locale="en-GB" />
          </Specimen>
          <Specimen label="context={Infinity}" wide>
            <Diff path={path} change="modified" before={filtersBefore} after={filtersAfter} context={Infinity} locale="en-GB" />
          </Specimen>
          <Specimen label="rows" wide>
            <Diff path={path} change="modified" rows={patchRows} locale="en-GB" />
          </Specimen>
        </>
      }
    />
  )
}
