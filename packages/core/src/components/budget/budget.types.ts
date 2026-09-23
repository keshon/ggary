import type { MeterSize } from '../meter/meter.types'
import type { StatusTone } from '../../utils/tone'

export interface BudgetProps {
  /** What has been spent. Above `max` the meter clamps and the words say it is over. */
  value: number
  /** The ceiling. A budget with no explicit ceiling is a metric, not a budget. */
  max: number
  /** The resource: "Tokens", "Wall time", "Cost". The meter's name. */
  label: string
  /**
   * How fast it is being spent, in units of `value` per second. THE POINT OF
   * THE COMPONENT: without it there is no forecast, and a figure with no
   * forecast is a meter. Zero means the spending has stopped.
   */
  rate?: number
  /**
   * What the spending has come to MEAN — a limit in sight, a limit spent.
   * The forecast has to repeat it in words: colour is never the only carrier.
   */
  tone?: StatusTone
  /** The thickness of the meter's track. */
  size?: MeterSize
  /** For the figures and the forecast. Default: the page's. */
  locale?: string
}

/** The fixed text of the forecast. */
export interface BudgetWords {
  /** The forecast, given when the ceiling will be reached in words ("in 12 minutes"). */
  forecast(when: string): string
  /** Nothing is being spent, so the ceiling will not be reached. */
  steady: string
  /** The ceiling has been reached. */
  spent: string
  /** The reading beside the meter's label: "184,200 of 250,000". */
  reading(value: string, max: string): string
  /** The reading when more has been spent than the ceiling allows. */
  over(value: string, max: string): string
}
