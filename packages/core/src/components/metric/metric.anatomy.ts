import { createAnatomy } from '../../types'

export const metricAnatomy = createAnatomy('metric', ['root', 'label', 'value', 'unit', 'delta', 'delta-icon'] as const)
export type MetricPart = (typeof metricAnatomy.parts)[number]

export const metricRowAnatomy = createAnatomy('metric-row', ['root'] as const)
export type MetricRowPart = (typeof metricRowAnatomy.parts)[number]
