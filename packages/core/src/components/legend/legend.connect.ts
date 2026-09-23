import type { Dict, Normalizer } from '../../types'
import { seriesAttr } from '../../utils/series'
import { legendAnatomy as anatomy } from './legend.anatomy'
import type { LegendItem, LegendProps, LegendWords } from './legend.types'

export const LEGEND_WORDS: LegendWords = {
  key: 'Chart key',
}

/**
 * The key to a chart's colours, and obligatory from two series up: colour
 * alone says nothing, and a chart whose colour means nothing is a coloured-in
 * picture. No machine — a legend is read, not operated. A legend that filters
 * the chart is a set of toggles and wants real buttons.
 *
 * A `<ul>` rather than a `<dl>`, though the pairing tempts: the value is
 * optional, so half of all legends would be a description list with nothing
 * described, and an item is one thing — a series, with a mark, a name and
 * sometimes a quantity — not a term and its definition. A list announces how
 * many series there are before it starts reading them, which is the fact the
 * reader wants first.
 *
 * The swatch is a mark and is hidden: it has no text, and a reader announcing
 * an empty node before every label is noise. The label says which series it
 * is; the value says how much. Both are words, so the legend survives colour
 * blindness, a black-and-white print and a forced-colours mode alike.
 */
export function connect<T = Dict>(props: LegendProps, normalize: Normalizer<T>, words: Partial<LegendWords> = {}) {
  const { items, direction = 'row' } = props
  const say = { ...LEGEND_WORDS, ...words }

  const getItemProps = (item: LegendItem) => ({
    showValue: item.value !== undefined && item.value !== '',
    itemProps: normalize({ ...anatomy.attrs('item') }),
    // The hue is data — which of six — so it rides on the item's own attribute.
    swatchProps: normalize({ ...anatomy.attrs('swatch'), 'data-series': seriesAttr(item.series), 'aria-hidden': 'true' }),
    labelProps: normalize({ ...anatomy.attrs('label') }),
    valueProps: normalize({ ...anatomy.attrs('value') }),
  })

  return {
    items,
    getItemProps,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      'data-direction': direction,
      'aria-label': props.label ?? say.key,
    }),
  }
}

export type LegendApi<T = Dict> = ReturnType<typeof connect<T>>
