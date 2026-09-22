import type { Dict, Normalizer } from '../../types'
import { timelineAnatomy as anatomy } from './timeline.anatomy'
import type { TimelineItem, TimelineProps } from './timeline.types'

const HOUR_MINUTE: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

/**
 * The label of a time: the author's own, or the moment formatted in the
 * locale. A value that does not parse is shown as given, not as "Invalid Date".
 */
export function timelineTimeLabel(item: TimelineItem, format: Intl.DateTimeFormat): string | undefined {
  if (item.timeLabel !== undefined) return item.timeLabel
  if (item.time === undefined) return undefined
  const moment = new Date(item.time)
  return Number.isNaN(moment.getTime()) ? item.time : format.format(moment)
}

/**
 * A chronology: what happened and when. An ordered list, because the order is
 * the meaning and a screen reader says "list, N items"; the line joining the
 * dots is the theme's pseudo-element, so it is never spoken. The tone sits on
 * the item, so anything inside that reads a tone — a StatusDot in a rich
 * body — agrees with the dot. The dot is hidden: the title says the tone in
 * words, and that is the author's to write. No machine.
 */
export function connect<T = Dict>(props: TimelineProps, normalize: Normalizer<T>) {
  const { items, label, locale, timeFormat } = props
  const format = new Intl.DateTimeFormat(locale, timeFormat ?? HOUR_MINUTE)

  const getItemProps = (item: TimelineItem) => {
    const timeLabel = timelineTimeLabel(item, format)
    return {
      timeLabel,
      showTime: timeLabel !== undefined,
      showDetail: item.detail !== undefined && item.detail !== '',
      itemProps: normalize({ ...anatomy.attrs('item'), 'data-tone': item.tone }),
      dotProps: normalize({ ...anatomy.attrs('dot'), 'aria-hidden': 'true' }),
      bodyProps: normalize({ ...anatomy.attrs('body') }),
      detailProps: normalize({ ...anatomy.attrs('detail') }),
      // Without a machine value, "14:36" is ambiguous outside the day it names.
      timeProps: normalize({ ...anatomy.attrs('time'), dateTime: item.time }),
    }
  }

  return {
    items,
    getItemProps,
    rootProps: normalize({ ...anatomy.attrs('root'), 'aria-label': label }),
  }
}
