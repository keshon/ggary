import { useId, type HTMLAttributes, type ReactNode } from 'react'
import {
  connectCluster,
  connectColumn,
  connectColumns,
  connectContainer,
  connectFlex,
  connectFlexItem,
  connectGrid,
  connectStack,
  type ClusterProps,
  type ColumnProps,
  type ColumnsProps,
  type ContainerProps,
  type FlexItemProps,
  type FlexProps,
  type GridProps,
  type StackProps,
} from '@ggary/core/flow'
import { connect as connectPageHeader } from '@ggary/core/page-header'
import { connect as connectSection } from '@ggary/core/section'
import { reactNormalizer, type HeadingLevel, type RegionRank } from '@ggary/core'

type Div = Omit<HTMLAttributes<HTMLDivElement>, 'title'>

/** A column; what is sized by its content keeps its width. */
export function Stack({ gap, children, ...rest }: StackProps & Div & { children?: ReactNode }) {
  const api = connectStack({ gap }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** A row that wraps. */
export function Cluster({ gap, justify, children, ...rest }: ClusterProps & Div & { children?: ReactNode }) {
  const api = connectCluster({ gap, justify }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** Everything after it in a Cluster stands at the far end. */
export function ClusterSpacer() {
  const api = connectCluster({}, reactNormalizer)
  return <span {...api.spacerProps} />
}

/** Cards in columns that fall to fewer as the width narrows. */
export function Grid({ gap, columns, children, ...rest }: GridProps & Div & { children?: ReactNode }) {
  const api = connectGrid({ gap, columns }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** Any flexbox: Stack and Cluster are its two presets. */
export function Flex({ direction, gap, align, justify, wrap, children, ...rest }: FlexProps & Div & { children?: ReactNode }) {
  const api = connectFlex({ direction, gap, align, justify, wrap }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** A child of a Flex with its share of the room. */
export function FlexItem({ grow, shrink, align, children, ...rest }: FlexItemProps & Div & { children?: ReactNode }) {
  const api = connectFlexItem({ grow, shrink, align }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** Twelve columns that answer to their own width. */
export function Columns({ gap, align, children, ...rest }: ColumnsProps & Div & { children?: ReactNode }) {
  const api = connectColumns({ gap, align }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** A span of the twelve, per width if it changes. */
export function Column({ span, start, children, ...rest }: ColumnProps & Div & { children?: ReactNode }) {
  const api = connectColumn({ span, start }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

/** The width a screen's content keeps, centred. */
export function Container({ size, children, ...rest }: ContainerProps & Div & { children?: ReactNode }) {
  const api = connectContainer({ size }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

export interface PageHeaderProps extends Div {
  title: ReactNode
  description?: ReactNode
  /** Default 1. */
  headingLevel?: HeadingLevel
  /** Above the title: breadcrumbs, a back link. */
  context?: ReactNode
  /** At the far edge: the screen's own actions. */
  actions?: ReactNode
}

/** The top of a screen: where you are, what this is, what can be done with it. */
export function PageHeader({ title, description, headingLevel, context, actions, ...rest }: PageHeaderProps) {
  const id = `gg-page-${useId().replace(/:/g, '')}`
  const api = connectPageHeader({ id, title: String(title), description: description == null ? undefined : 'yes', headingLevel }, reactNormalizer)
  const Title = api.titleElement
  return (
    // A div, not <header>: outside a main one would be the page's banner landmark, which the shell's header is.
    <div {...rest} {...api.rootProps}>
      {context != null && <div {...api.contextProps}>{context}</div>}
      <div {...api.mainProps}>
        <Title {...api.titleProps}>{title}</Title>
        {description != null && <p {...api.descriptionProps}>{description}</p>}
      </div>
      {actions != null && <div {...api.actionsProps}>{actions}</div>}
    </div>
  )
}

export interface SectionProps extends Div {
  title?: ReactNode
  description?: ReactNode
  /** Default 2. */
  headingLevel?: HeadingLevel
  rank?: RegionRank
  /** A landmark, named by the title. */
  region?: boolean
  actions?: ReactNode
  children?: ReactNode
}

/** A stretch of the page under its heading, with no box around it. */
export function Section({ title, description, headingLevel, rank, region, actions, children, ...rest }: SectionProps) {
  const id = `gg-section-${useId().replace(/:/g, '')}`
  const api = connectSection(
    { id, title: title == null ? undefined : String(title), description: description == null ? undefined : 'yes', headingLevel, rank, region },
    reactNormalizer
  )
  const Title = api.titleElement
  const head = title != null || actions != null || description != null
  return (
    <section {...rest} {...api.rootProps}>
      {head && (
        <div {...api.headerProps}>
          {title != null && <Title {...api.titleProps}>{title}</Title>}
          {actions != null && <div {...api.actionsProps}>{actions}</div>}
          {description != null && <p {...api.descriptionProps}>{description}</p>}
        </div>
      )}
      <div {...api.bodyProps}>{children}</div>
    </section>
  )
}
