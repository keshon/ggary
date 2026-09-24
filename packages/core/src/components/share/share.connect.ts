import type { Dict, Normalizer } from '../../types'
import { shareAnatomy as anatomy } from './share.anatomy'
import type { ShareItem, ShareProps, ShareWords } from './share.types'

export const SHARE_WORDS: Required<ShareWords> = {
  part: (value, label, unit) => (unit ? `${value} ${unit} ${label}` : `${value} ${label}`),
  separator: ', ',
  labelSeparator: ': ',
  empty: 'Nothing yet',
}

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

/**
 * The values as whole percentages that still total 100.
 *
 * Largest remainder: every part is floored, and the points left over go to the
 * parts whose remainders were largest, earliest first. Rounding each part on
 * its own would leave a bar of 99 or 102 — a gap of track at the end, or a
 * part pushed out of the strip — and the bar would stop being a division of
 * one whole.
 *
 * Then the floor: a part with a value of its own never falls to 0, because a
 * 0 is not drawn and the bar would then say the outcome did not happen. Half
 * an hour of downtime in a day is 2%; two minutes is not nothing either. The
 * point it needs is taken from the largest part, which can spare it — and that
 * is the whole of the minimum: a percent, in the units the bar is drawn in,
 * rather than a pixel floor. A floor in pixels would draw 0.02% as wide as 2%
 * at one bar width and differently at the next, and the bar would stop
 * reporting proportion in the units it claims to report it in. With more than
 * 100 parts there is no room for one each; the smallest then go undrawn, and
 * the name still says them.
 */
export function sharePercents(values: number[]): number[] {
  const clean = values.map(positive)
  const total = clean.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return clean.map(() => 0)

  const exact = clean.map((value) => (value / total) * 100)
  const percents = exact.map(Math.floor)
  const order = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  let left = 100 - percents.reduce((sum, value) => sum + value, 0)
  for (const { index } of order) {
    if (left <= 0) break
    percents[index] += 1
    left -= 1
  }

  const largest = () => percents.reduce((best, value, index) => (value > percents[best] ? index : best), 0)
  for (let index = 0; index < percents.length; index += 1) {
    if (clean[index] === 0 || percents[index] > 0) continue
    const from = largest()
    if (percents[from] <= 1) break
    percents[from] -= 1
    percents[index] = 1
  }
  return percents
}

/**
 * What a period was made OF: twenty-two hours up, an hour and a half down,
 * half an hour nobody looked. One bar, divided by each part's share of the
 * total — so the bar is always full, and what nobody accounted for is a part
 * of its own ("not checked") rather than bare track.
 *
 * The bar is one picture with one name: `role="img"` and the reading in words,
 * built here from the items ("22 h up, 1.5 h down, 0.5 h unknown"). The
 * segments are empty boxes and say nothing on their own, so a Share of more
 * than two parts wants a Legend beside it: the name is read, the picture is
 * seen, and only the legend joins a colour to a word for someone looking at
 * it. No machine.
 *
 * Each part takes its colour from a series or from a tone, and which to use is
 * the question the data answers: outcomes are tones (the same green as the ok
 * badge on the same screen), categories are series (told apart, and meaning
 * nothing on their own). A part with neither is the accent — one part is not a
 * category.
 *
 * A part with a value and no visible width is the failure this guards against;
 * see `sharePercents` for the rounding and the minimum.
 */
export function connect<T = Dict>(props: ShareProps, normalize: Normalizer<T>, options: { words?: ShareWords } = {}) {
  const { words = {} } = options
  const { items, label, unit, locale, size = 'md' } = props
  const w = { ...SHARE_WORDS, ...words }
  const format = new Intl.NumberFormat(locale)
  const percents = sharePercents(items.map((item) => item.value))

  const reading = items.map((item) => w.part(format.format(positive(item.value)), item.label, unit)).join(w.separator)
  const name = items.length === 0 ? w.empty : label ? `${label}${w.labelSeparator}${reading}` : reading

  const segments = items
    .map((item, index) => ({ item, percent: percents[index], index }))
    .filter((segment) => segment.percent > 0)
    .map(({ item, percent, index }) => ({
      item: item as ShareItem,
      percent,
      key: `${index}-${item.label}`,
      segmentProps: normalize({
        ...anatomy.attrs('segment'),
        'data-tone': item.tone,
        // A judgement outranks a category: never both on one segment.
        'data-series': item.tone === undefined ? item.series : undefined,
        style: { '--gg-share': percent },
      }),
    }))

  return {
    segments,
    /** The reading, as the root is named by it. */
    label: name,
    rootProps: normalize({ ...anatomy.attrs('root'), 'data-size': size, role: 'img', 'aria-label': name }),
  }
}
