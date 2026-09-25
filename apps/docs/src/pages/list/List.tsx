import { useState } from 'react'
import { Avatar, Badge, Button, Icon, List, ListItem } from '@ggary/react'
import { DemoPage, Specimen } from '../../react/DemoPage'
import { reviewers, reviewersLater, type Reviewer } from '../../data/reviewers'

type How = 'link' | 'press' | 'plain'

function Row({ who, how }: { who: Reviewer; how: How }) {
  return (
    <ListItem
      title={who.name}
      description={who.line}
      href={how === 'link' ? '#/list' : undefined}
      onSelect={how === 'press' ? () => {} : undefined}
      current={who.current ? (how === 'link' ? 'page' : true) : undefined}
      disabled={who.disabled}
      leading={<Avatar name={who.name} size="sm" decorative />}
      meta={
        <>
          <Badge tone={who.tone}>{who.word}</Badge>
          <span>{who.when}</span>
        </>
      }
      actions={
        <Button size="sm" emphasis="minimal" aria-label={`More for ${who.name}`}>
          <Icon name="more" />
        </Button>
      }
    />
  )
}

function LoadingMore() {
  const [rows, setRows] = useState(reviewers)
  return (
    <List variant="bordered" label="Reviewers" count={`${rows.length} of 6`} hasMore={rows.length < 6} onLoadMore={async () => setRows([...rows, ...(await reviewersLater())])} words={{ more: `Show ${6 - rows.length} more` }}>
      {rows.map((who) => (
        <Row key={who.name} who={who} how="press" />
      ))}
    </List>
  )
}

export default function ListPage() {
  return (
    <DemoPage
      variants={(['divided', 'bordered', 'cards'] as const).map((variant) => (
        <Specimen key={variant} label={`variant="${variant}"`} wide>
          <List variant={variant} label="Reviewers" count="4 of 16">
            {reviewers.map((who) => (
              <Row key={who.name} who={who} how="link" />
            ))}
          </List>
        </Specimen>
      ))}
      states={
        <Specimen label="current · disabled · onLoadMore" wide>
          <LoadingMore />
        </Specimen>
      }
      composition={(['link', 'press', 'plain'] as const).map((how) => (
        <Specimen key={how} label={how === 'link' ? 'ListItem href' : how === 'press' ? 'ListItem onSelect' : 'ListItem, plain'} wide>
          <List ariaLabel="Reviewers">
            {reviewers.slice(0, 2).map((who) => (
              <Row key={who.name} who={who} how={how} />
            ))}
          </List>
        </Specimen>
      ))}
    />
  )
}
