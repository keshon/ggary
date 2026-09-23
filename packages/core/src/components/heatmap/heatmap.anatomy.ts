import { createAnatomy } from '../../types'

export const heatmapAnatomy = createAnatomy('heatmap', ['root', 'week', 'day', 'month-label'] as const)
export type HeatmapPart = (typeof heatmapAnatomy.parts)[number]
