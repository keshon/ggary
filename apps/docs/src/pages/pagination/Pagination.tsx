import { useState } from 'react'
import { Pagination, paginationRange } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { edges, href } from './data'

const SIZES = ['sm', 'md', 'lg'] as const

/** The page is the owner's: a press on a number moves it, and the link is not followed. */
function Live() {
  const [page, setPage] = useState(7)
  return (
    <Pagination
      label="Runs, pages"
      items={paginationRange({ page, pages: 24, ...edges, href })}
      onPageChange={(next, event) => {
        event.preventDefault()
        setPage(next)
      }}
    />
  )
}

export default function PaginationPage() {
  return (
    <DemoPage
      variants={
        <>
          <Specimen label="pages: 5" wide>
            <Pagination label="Runs, pages" items={paginationRange({ page: 3, pages: 5, href })} />
          </Specimen>
          <Specimen label="pages: 24" wide>
            <Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, href })} />
          </Specimen>
          <Specimen label="around: 2" wide>
            <Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, around: 2, href })} />
          </Specimen>
          <Specimen label="previousLabel · nextLabel" wide>
            <Pagination label="Runs, pages" items={paginationRange({ page: 12, pages: 24, ...edges, href })} />
          </Specimen>
        </>
      }
      sizes={SIZES.map((size) => (
        <Specimen key={size} label={`size="${size}"`} wide>
          <Pagination label="Runs, pages" size={size} items={paginationRange({ page: 3, pages: 9, ...edges, href })} />
        </Specimen>
      ))}
      states={
        <Specimen label="disabled" wide>
          <Pagination label="Runs, pages" items={paginationRange({ page: 1, pages: 24, ...edges, href })} />
        </Specimen>
      }
      composition={
        <Specimen label="onPageChange" wide>
          <Live />
        </Specimen>
      }
    />
  )
}
