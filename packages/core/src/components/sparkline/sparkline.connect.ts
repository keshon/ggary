import type { Dict, Normalizer } from '../../types'
import { seriesAttr } from '../../utils/series'
import { sparklineAnatomy as anatomy } from './sparkline.anatomy'
import type { SparklineDirection, SparklineProps, SparklineWords } from './sparkline.types'

/**
 * The grid the shape is drawn on, and the only numbers in here that are not
 * the data's. They are viewBox units rather than pixels: the theme gives the
 * `<svg>` a size, and the same geometry serves a sparkline 60px wide and one
 * 300px wide. 120 by 32 is the proportion the shape was drawn at — wide and
 * low, so a rise reads as a rise rather than a spike.
 */
export const SPARKLINE_VIEWBOX = { width: 120, height: 32 } as const

/**
 * The dot of the last value, in the same units. It is geometry, not a look:
 * an `r` cannot be given in CSS everywhere yet. The theme owns its colour and
 * the ring around it.
 */
export const SPARKLINE_DOT_RADIUS = 2.5

export const SPARKLINE_WORDS: SparklineWords = {
  reading: (first, last, direction) =>
    direction === 'level' ? `${last}, level from ${first}` : `${last}, ${direction} from ${first}`,
  empty: 'No data',
}

export interface SparklinePoint {
  x: number
  y: number
}

export interface SparklineGeometry {
  /** Nothing to draw: fewer than two values, or one that is not a finite number. */
  empty: boolean
  points: SparklinePoint[]
  /** The path of the line, `M`-and-implicit-lineto. Empty when there is nothing to draw. */
  linePath: string
  /** The same path closed down to the bottom edge, for the fill under it. */
  areaPath: string
  /** Where the series got to. `null` when there is nothing to draw. */
  lastPoint: SparklinePoint | null
  min: number
  max: number
}

/** Two decimals is a tenth of a viewBox unit: finer than any screen, shorter than a float. */
const round = (value: number) => Math.round(value * 100) / 100

/**
 * The shape of the numbers: x by position, y by value, top to bottom.
 *
 * A flat series has no range at all, and dividing by it would give every
 * point `NaN` and draw no line where there is plainly a line to draw. It
 * runs through the middle instead — a series that did not move is a
 * horizontal line, which is the truth about it.
 */
export function sparklineGeometry(values: number[]): SparklineGeometry {
  const { width, height } = SPARKLINE_VIEWBOX
  if (values.length < 2 || !values.every((value) => Number.isFinite(value))) {
    return { empty: true, points: [], linePath: '', areaPath: '', lastPoint: null, min: 0, max: 0 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const points = values.map((value, index) => ({
    x: round((index / (values.length - 1)) * width),
    y: round(range === 0 ? height / 2 : height - ((value - min) / range) * height),
  }))

  const linePath = `M${points.map((point) => `${point.x},${point.y}`).join(' ')}`
  const lastPoint = points[points.length - 1]!
  // Closed down to the bottom edge and back to the first x: the fill is the
  // area under the line, so it must end where the line began.
  const areaPath = `${linePath} ${lastPoint.x},${height} ${points[0]!.x},${height}Z`
  return { empty: false, points, linePath, areaPath, lastPoint, min, max }
}

/**
 * The shape of a change beside a number. No axes, no grid, no labels: the
 * moment those are wanted it is a chart, and a chart is another component.
 *
 * Core computes the geometry and nothing else — the paths, the last point,
 * the range — on a fixed viewBox, so the theme sizes the picture in CSS and
 * no pixel is decided here. One series only: colour encodes nothing when
 * there is a single line, so the hue is the accent unless `series` names one
 * of the six, and then a legend must name it in words beside the chart.
 *
 * To a screen reader it is a picture of numbers: `role="img"` with the
 * reading in words, or `aria-hidden` when the same numbers stand beside it
 * in text (`describe: false`). There is no third way — an unnamed picture is
 * an announcement of nothing.
 */
export function connect<T = Dict>(props: SparklineProps, normalize: Normalizer<T>, words: Partial<SparklineWords> = {}) {
  const { values, area = false, last = true, series, describe = true, locale } = props
  const geometry = sparklineGeometry(values)
  const say = { ...SPARKLINE_WORDS, ...words }

  const format = (value: number) => new Intl.NumberFormat(locale).format(value)
  const first = values[0]
  const final = values[values.length - 1]
  const direction: SparklineDirection = geometry.empty || first === final ? 'level' : final! > first! ? 'up' : 'down'
  const name = geometry.empty
    ? (props.label ?? say.empty)
    : (props.label ?? say.reading(format(first!), format(final!), direction))

  return {
    ...geometry,
    viewBox: `0 0 ${SPARKLINE_VIEWBOX.width} ${SPARKLINE_VIEWBOX.height}`,
    radius: SPARKLINE_DOT_RADIUS,
    direction,
    label: name,
    showArea: area && !geometry.empty,
    showLast: last && !geometry.empty,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      viewBox: `0 0 ${SPARKLINE_VIEWBOX.width} ${SPARKLINE_VIEWBOX.height}`,
      // A sparkline spans the width it is given and keeps its height: the
      // stroke is told not to scale with it, or a stretched line would come
      // out thicker than the kit draws lines.
      preserveAspectRatio: 'none',
      'data-series': seriesAttr(series),
      'data-empty': geometry.empty ? '' : undefined,
      role: describe ? 'img' : undefined,
      'aria-label': describe ? name : undefined,
      'aria-hidden': describe ? undefined : 'true',
    }),
    /** Drawn first, so the line runs over its own fill rather than under it. */
    areaProps: normalize({ ...anatomy.attrs('area'), d: geometry.areaPath }),
    lineProps: normalize({ ...anatomy.attrs('line'), d: geometry.linePath }),
    lastProps: normalize({
      ...anatomy.attrs('last'),
      cx: geometry.lastPoint?.x,
      cy: geometry.lastPoint?.y,
      r: SPARKLINE_DOT_RADIUS,
    }),
  }
}

export type SparklineApi<T = Dict> = ReturnType<typeof connect<T>>
