/**
 * Instrument's contrast promises, ported from instrument/tools/cmd/contrast.
 *
 * Every row, label and threshold is carried over. The Go original documents the
 * reasoning for each group at length; the short form is kept here, and the
 * original stays the reference for WHY a row exists.
 *
 * Rows cover the whole Instrument vocabulary — charts, tracks, banners, rank —
 * not only the four components ported so far. The tokens are all ported, and a
 * token a component will use tomorrow is cheapest to guard today.
 */
import { LARGE, STEP, TEXT, defineThemeCheck, type Context, type Pair } from '@ggary/checks'

const modes = ['light-neutral', 'light', 'light-cool', 'dark-soft', 'dark']
// Petrol is the base: no attribute at all, exactly as a project ships it.
const accents = [null, 'graphite', 'indigo', 'clay']

const contexts: Context[] = modes.flatMap((mode) =>
  accents.map((accent) => ({
    label: `${mode} / ${accent ?? 'petrol'}`,
    attributes: { 'data-mode': mode, ...(accent ? { 'data-accent': accent } : {}) },
  }))
)

const text = TEXT
const large = LARGE
const step = STEP

const pairs: Pair[] = [
  // Text on the three surfaces — each step checked everywhere it can appear.
  { label: 'text: primary on panel', fg: '--text-primary', bg: ['--surface-raised'], min: text },
  { label: 'text: primary on page', fg: '--text-primary', bg: ['--surface-page'], min: text },
  { label: 'text: primary in inset', fg: '--text-primary', bg: ['--surface-sunken'], min: text },
  { label: 'text: secondary on panel', fg: '--text-secondary', bg: ['--surface-raised'], min: text },
  { label: 'text: secondary in inset', fg: '--text-secondary', bg: ['--surface-sunken'], min: text },
  { label: 'text: muted on panel', fg: '--text-muted', bg: ['--surface-raised'], min: text },
  { label: 'text: muted on page', fg: '--text-muted', bg: ['--surface-page'], min: text },
  { label: 'text: muted in inset (log)', fg: '--text-muted', bg: ['--surface-sunken'], min: text },
  // Recesses are translucent films, so they are declared as a STACK: without
  // the base, the gate would measure the film's alpha against black.
  { label: 'text: primary in field on panel', fg: '--text-primary', bg: ['--surface-raised', '--surface-field'], min: text },
  { label: 'text: primary in field on page', fg: '--text-primary', bg: ['--surface-page', '--surface-field'], min: text },
  { label: 'text: button label', fg: '--text-primary', bg: ['--surface-raised', '--surface-recessed'], min: text },
  { label: 'text: button label on hover', fg: '--text-primary', bg: ['--surface-raised', '--surface-recessed-hover'], min: text },
  { label: 'text: tag on panel', fg: '--text-secondary', bg: ['--surface-raised', '--surface-recessed'], min: text },
  { label: 'text: selected chip', fg: '--accent-text', bg: ['--surface-raised', '--surface-recessed'], min: text },

  // faint is a DECORATION threshold, and forbidden for text that is read.
  { label: 'decor: faint on panel', fg: '--text-faint', bg: ['--surface-raised'], min: large },
  { label: 'decor: faint in inset', fg: '--text-faint', bg: ['--surface-sunken'], min: large },

  // Badges are 11px: the full text threshold.
  { label: 'badge: accent on own background', fg: '--accent-text', bg: ['--surface-raised', '--accent-bg'], min: text },
  { label: 'badge: ok on own background', fg: '--ok-text', bg: ['--surface-raised', '--ok-bg'], min: text },
  { label: 'badge: warn on own background', fg: '--warn-text', bg: ['--surface-raised', '--warn-bg'], min: text },
  { label: 'badge: err on own background', fg: '--err-text', bg: ['--surface-raised', '--err-bg'], min: text },
  { label: 'badge: neutral in inset', fg: '--text-secondary', bg: ['--surface-sunken'], min: text },

  // Status text outside badges: metric delta, field error, footnote.
  { label: 'status: ok-text on panel', fg: '--ok-text', bg: ['--surface-raised'], min: text },
  { label: 'status: warn-text on panel', fg: '--warn-text', bg: ['--surface-raised'], min: text },
  { label: 'status: err-text on panel', fg: '--err-text', bg: ['--surface-raised'], min: text },
  { label: 'status: ok-text in inset', fg: '--ok-text', bg: ['--surface-sunken'], min: text },
  { label: 'status: warn-text in inset', fg: '--warn-text', bg: ['--surface-sunken'], min: text },
  { label: 'status: err-text in inset', fg: '--err-text', bg: ['--surface-sunken'], min: text },

  // Solid button. Hover must RAISE the label's contrast, not lower it.
  { label: 'button: label on accent-solid', fg: '--accent-on', bg: ['--accent-solid'], min: text },
  { label: 'button: label on accent-hover', fg: '--accent-on', bg: ['--accent-hover'], min: text },
  { label: 'link: accent-text on page', fg: '--accent-text', bg: ['--surface-page'], min: text },

  // State marks: non-text but meaningful, 3:1, measured with the token they are
  // painted with (--*-mark, not the text step).
  { label: 'mark: ok on panel', fg: '--ok-mark', bg: ['--surface-raised'], min: large },
  { label: 'mark: ok in inset', fg: '--ok-mark', bg: ['--surface-sunken'], min: large },
  { label: 'mark: ok on track', fg: '--ok-mark', bg: ['--surface-raised', '--track'], min: large },
  { label: 'mark: warn on panel', fg: '--warn-mark', bg: ['--surface-raised'], min: large },
  { label: 'mark: warn in inset', fg: '--warn-mark', bg: ['--surface-sunken'], min: large },
  { label: 'mark: err on panel', fg: '--err-mark', bg: ['--surface-raised'], min: large },
  { label: 'mark: err in inset', fg: '--err-mark', bg: ['--surface-sunken'], min: large },
  { label: 'mark: err on track', fg: '--err-mark', bg: ['--surface-raised', '--track'], min: large },
  { label: 'dot: running on panel', fg: '--accent-mark', bg: ['--surface-raised'], min: large },
  { label: 'dot: running in inset', fg: '--accent-mark', bg: ['--surface-sunken'], min: large },
  { label: 'caret on panel', fg: '--accent-mark', bg: ['--surface-raised'], min: large },
  { label: 'slider on track', fg: '--accent-mark', bg: ['--surface-raised', '--track'], min: large },

  // A switch has to be visible while EMPTY, or "off" reads as "no control".
  { label: 'switch: off track on page', fg: '--switch-track', bg: ['--surface-page'], min: large },
  { label: 'switch: off track on panel', fg: '--switch-track', bg: ['--surface-raised'], min: large },
  { label: 'switch: off track in inset', fg: '--switch-track', bg: ['--surface-sunken'], min: large },

  // Load-bearing borders: the border IS the control.
  { label: 'control border on panel', fg: '--border-control', bg: ['--surface-raised'], min: large },
  { label: 'control border on page', fg: '--border-control', bg: ['--surface-page'], min: large },
  { label: 'control border in inset', fg: '--border-control', bg: ['--surface-raised', '--surface-field'], min: large },

  // A meter's fill against its track, on every surface a meter sits on.
  { label: 'measure: fill on track (panel)', fg: '--accent-mark', bg: ['--surface-raised', '--track'], min: large },
  { label: 'measure: fill on track (inset)', fg: '--accent-mark', bg: ['--surface-sunken', '--track'], min: large },
  { label: 'measure: ok on track', fg: '--ok-text', bg: ['--surface-raised', '--track'], min: large },
  { label: 'measure: warn on track', fg: '--warn-text', bg: ['--surface-raised', '--track'], min: large },
  { label: 'measure: err on track', fg: '--err-text', bg: ['--surface-raised', '--track'], min: large },

  // Categorical palette: every series separates from the surface.
  { label: 'chart: series 1 on panel', fg: '--chart-1', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 1 on page', fg: '--chart-1', bg: ['--surface-page'], min: large },
  { label: 'chart: series 2 on panel', fg: '--chart-2', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 2 on page', fg: '--chart-2', bg: ['--surface-page'], min: large },
  { label: 'chart: series 3 on panel', fg: '--chart-3', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 3 on page', fg: '--chart-3', bg: ['--surface-page'], min: large },
  { label: 'chart: series 4 on panel', fg: '--chart-4', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 4 on page', fg: '--chart-4', bg: ['--surface-page'], min: large },
  { label: 'chart: series 5 on panel', fg: '--chart-5', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 5 on page', fg: '--chart-5', bg: ['--surface-page'], min: large },
  { label: 'chart: series 6 on panel', fg: '--chart-6', bg: ['--surface-raised'], min: large },
  { label: 'chart: series 6 on page', fg: '--chart-6', bg: ['--surface-page'], min: large },

  // Overlays: everything on --surface-overlay.
  { label: 'popover: text', fg: '--text-primary', bg: ['--surface-overlay'], min: text },
  { label: 'menu: keyboard shortcut', fg: '--text-muted', bg: ['--surface-overlay'], min: text },
  { label: 'menu: dangerous item', fg: '--err-text', bg: ['--surface-overlay'], min: text },
  // The port highlights a row with a plate under it, so the row is read on it.
  { label: 'menu: dangerous item highlighted', fg: '--err-text', bg: ['--surface-overlay', '--err-bg'], min: text },
  { label: 'menu: item highlighted', fg: '--text-primary', bg: ['--surface-overlay', '--surface-hover'], min: text },
  { label: 'menu: shortcut on highlighted row', fg: '--text-secondary', bg: ['--surface-overlay', '--surface-hover'], min: text },
  { label: 'avatar: initials on the disc', fg: '--text-secondary', bg: ['--surface-raised', '--surface-recessed'], min: text },
  { label: 'badge: plain word on its plate', fg: '--text-secondary', bg: ['--surface-raised', '--surface-recessed'], min: text },
  { label: 'badge: count on its fill', fg: '--accent-on', bg: ['--accent-solid'], min: text },
  // Instrument's doc says the arc holds 3:1 against the track; measured, the pair is
  // 1.3 to 1.4:1. The load-bearing contrast is the arc on its ground.
  { label: 'spinner: arc on the panel', fg: '--accent-mark', bg: ['--surface-raised'], min: large },
  { label: 'spinner: arc on the page', fg: '--accent-mark', bg: ['--surface-page'], min: large },
  { label: 'breadcrumbs: the path on the page', fg: '--text-muted', bg: ['--surface-page'], min: text },
  { label: 'breadcrumbs: the current crumb', fg: '--text-primary', bg: ['--surface-page'], min: text },
  { label: 'nav: a resting item on the column', fg: '--text-secondary', bg: ['--surface-page', '--surface-sunken'], min: text },
  { label: 'nav: the current item on its surface', fg: '--accent-text', bg: ['--surface-page', '--surface-selected'], min: text },
  { label: 'nav: a count on its plate', fg: '--text-secondary', bg: ['--surface-page', '--surface-sunken'], min: text },
  { label: 'pagination: a resting page', fg: '--text-secondary', bg: ['--surface-page'], min: text },
  { label: 'pagination: the ellipsis of the pages left out', fg: '--text-muted', bg: ['--surface-page'], min: text },
  { label: 'steps: the name of a step', fg: '--text-secondary', bg: ['--surface-page'], min: text },
  { label: 'steps: the word of its state', fg: '--text-muted', bg: ['--surface-page'], min: text },
  { label: 'steps: the bar of a step reached', fg: '--accent-mark', bg: ['--surface-page'], min: large },
  { label: 'choice card: description on its ground', fg: '--text-secondary', bg: ['--surface-raised'], min: text },
  { label: 'choice card: description on the chosen ground', fg: '--text-secondary', bg: ['--surface-page', '--accent-bg'], min: text },
  { label: 'choice card: title on the chosen ground', fg: '--text-primary', bg: ['--surface-page', '--accent-bg'], min: text },
  { label: 'search: the magnifier on the field', fg: '--text-muted', bg: ['--surface-field'], min: large },
  { label: 'input group: affix on its recess', fg: '--text-muted', bg: ['--surface-page', '--surface-recessed'], min: text },
  { label: 'file drop: hint on the zone', fg: '--text-muted', bg: ['--surface-field'], min: text },
  { label: 'file drop: words on the zone under a drag', fg: '--text-secondary', bg: ['--surface-page', '--accent-bg'], min: text },
  { label: 'segmented: resting label on the track', fg: '--text-secondary', bg: ['--surface-page', '--surface-recessed'], min: text },
  { label: 'segmented: chosen label', fg: '--text-primary', bg: ['--surface-page', '--surface-recessed', '--surface-raised'], min: text },
  { label: 'slider: fill on the panel', fg: '--accent-mark', bg: ['--surface-raised'], min: large },
  { label: 'slider: thumb on the page', fg: '--accent-mark', bg: ['--surface-page'], min: large },
  { label: 'slider: value beside the track', fg: '--text-primary', bg: ['--surface-raised'], min: text },
  { label: 'number field: axis letter', fg: '--text-muted', bg: ['--surface-raised', '--surface-field'], min: text },
  { label: 'region: support title on the recess', fg: '--text-muted', bg: ['--surface-page', '--surface-recessed'], min: text },
  { label: 'banner: detail on a plain ground', fg: '--text-secondary', bg: ['--surface-page', '--surface-sunken'], min: text },
  { label: 'banner: detail on the error ground', fg: '--text-secondary', bg: ['--surface-page', '--err-bg'], min: text },
  { label: 'banner: detail on the warn ground', fg: '--text-secondary', bg: ['--surface-page', '--warn-bg'], min: text },
  { label: 'banner: detail on the ok ground', fg: '--text-secondary', bg: ['--surface-page', '--ok-bg'], min: text },
  { label: 'empty state: description on the panel', fg: '--text-muted', bg: ['--surface-raised'], min: text },
  { label: 'toast: detail text', fg: '--text-secondary', bg: ['--surface-overlay'], min: text },
  { label: 'toast: action on its hover plate', fg: '--text-primary', bg: ['--surface-overlay', '--surface-hover'], min: text },
  { label: 'toast: ok icon', fg: '--ok-text', bg: ['--surface-overlay'], min: large },
  { label: 'toast: warn icon', fg: '--warn-text', bg: ['--surface-overlay'], min: large },
  { label: 'toast: running icon', fg: '--accent-text', bg: ['--surface-overlay'], min: large },
  { label: 'tabs: resting label on the page', fg: '--text-secondary', bg: ['--surface-page'], min: text },
  { label: 'tabs: bar under the selected tab', fg: '--accent-solid', bg: ['--surface-page'], min: large },
  { label: 'tabs: resting chip label on the track', fg: '--text-secondary', bg: ['--surface-page', '--surface-recessed'], min: text },
  { label: 'tabs: selected chip label', fg: '--text-primary', bg: ['--surface-page', '--surface-recessed', '--surface-raised'], min: text },
  { label: 'tabs: unsaved dot on the track', fg: '--accent-mark', bg: ['--surface-page', '--surface-recessed'], min: large },
  { label: 'menubar: resting item on the page', fg: '--text-secondary', bg: ['--surface-page'], min: text },
  { label: 'menubar: resting item on a panel', fg: '--text-secondary', bg: ['--surface-raised'], min: text },
  { label: 'menubar: open item', fg: '--text-primary', bg: ['--surface-page', '--surface-hover'], min: text },
  { label: 'menu: submenu chevron', fg: '--text-muted', bg: ['--surface-overlay', '--surface-hover'], min: large },
  { label: 'menu: marked item', fg: '--accent-text', bg: ['--surface-overlay'], min: text },
  { label: 'tooltip: text', fg: '--text-primary', bg: ['--surface-overlay'], min: text },
  // The select's check mark: a mark with no label over it, on the popover. Not
  // in the Go table (Instrument has no custom listbox); added by the port so the
  // coverage rule has a real row for --accent-mark on the surface it sits on.
  { label: 'select: check mark on popover', fg: '--accent-mark', bg: ['--surface-overlay'], min: large },

  // Banner: text over a tinted fill.
  { label: 'banner ok: heading', fg: '--text-primary', bg: ['--surface-page', '--ok-bg'], min: text },
  { label: 'banner warn: heading', fg: '--text-primary', bg: ['--surface-page', '--warn-bg'], min: text },
  { label: 'banner error: heading', fg: '--text-primary', bg: ['--surface-page', '--err-bg'], min: text },
  { label: 'banner warn: explanation', fg: '--text-secondary', bg: ['--surface-page', '--warn-bg'], min: text },
  { label: 'banner warn: icon', fg: '--warn-text', bg: ['--surface-page', '--warn-bg'], min: large },

  // Forms.
  { label: 'choice card: heading', fg: '--text-primary', bg: ['--surface-raised', '--accent-bg'], min: text },
  { label: 'choice card: description', fg: '--text-secondary', bg: ['--surface-raised', '--accent-bg'], min: text },
  { label: 'multi-select: selected item', fg: '--accent-text', bg: ['--surface-raised', '--surface-field', '--surface-selected'], min: text },
  { label: 'field prefix', fg: '--text-muted', bg: ['--surface-sunken'], min: text },
  { label: 'readonly: text in inset', fg: '--text-primary', bg: ['--surface-sunken'], min: text },
  { label: 'file zone dashed border', fg: '--border-control', bg: ['--surface-raised', '--surface-field'], min: large },
  { label: 'required marker', fg: '--err-text', bg: ['--surface-raised'], min: text },
  // Added by the port with the Input component: the placeholder is read, on the
  // field surface itself, and the invalid border stands in for the error state.
  { label: 'field: placeholder in field on panel', fg: '--text-muted', bg: ['--surface-raised', '--surface-field'], min: text },
  { label: 'field: invalid border on panel', fg: '--err-text', bg: ['--surface-raised', '--surface-field'], min: large },
  { label: 'field: hint on panel', fg: '--text-muted', bg: ['--surface-raised'], min: text },

  // Added with Popover and Tooltip: the popover is --surface-overlay like the
  // dialog; the tooltip is small text on the inverse plate.
  { label: 'popover: text on overlay', fg: '--text-primary', bg: ['--surface-overlay'], min: text },
  { label: 'tooltip: text on inverse', fg: '--text-on-inverse', bg: ['--surface-inverse'], min: text },

  // Added with Dialog: the sheet is --surface-overlay, and its title,
  // sub-label and close cross stand on it.
  { label: 'dialog: title on overlay', fg: '--text-primary', bg: ['--surface-overlay'], min: text },
  { label: 'dialog: description on overlay', fg: '--text-secondary', bg: ['--surface-overlay'], min: text },
  { label: 'dialog: close cross on overlay', fg: '--text-muted', bg: ['--surface-overlay'], min: large },

  // Added with Checkbox, Radio and Switch. The source's pairs for the box edge
  // and the switch track are ported as they were; the thumb is new here, since
  // it is a part of its own that has to read against both tracks.
  { label: 'choice: box edge in field on panel', fg: '--border-control', bg: ['--surface-raised', '--surface-field'], min: large },
  { label: 'choice: checked fill on panel', fg: '--accent-solid', bg: ['--surface-raised'], min: large },
  { label: 'choice: mark on checked fill', fg: '--accent-on', bg: ['--accent-solid'], min: large },
  { label: 'switch: thumb on off track', fg: '--surface-raised', bg: ['--surface-raised', '--switch-track'], min: large },
  { label: 'switch: thumb on on track', fg: '--surface-raised', bg: ['--accent-solid'], min: large },

  // Layout and navigation.
  { label: 'text on sidebar', fg: '--text-secondary', bg: ['--surface-sunken'], min: text },
  { label: 'navigation: current item', fg: '--accent-text', bg: ['--surface-sunken', '--surface-selected'], min: text },
  { label: 'navigation: edge marker', fg: '--accent-solid', bg: ['--surface-sunken', '--surface-selected'], min: large },
  { label: 'tab: underline', fg: '--accent-solid', bg: ['--surface-page'], min: large },
  { label: 'breadcrumbs: separator', fg: '--text-faint', bg: ['--surface-page'], min: large },
  { label: 'pagination: current page', fg: '--accent-text', bg: ['--surface-page', '--surface-selected'], min: text },
  { label: 'steps: completed bar', fg: '--accent-mark', bg: ['--surface-page', '--track'], min: large },

  // The inverse plate: its own foreground, and it must part from what it floats over.
  { label: 'annotation: text on inverse', fg: '--text-on-inverse', bg: ['--surface-inverse'], min: text },
  { label: 'annotation: plate on page', fg: '--surface-inverse', bg: ['--surface-page'], min: large },
  { label: 'annotation: plate on panel', fg: '--surface-inverse', bg: ['--surface-raised'], min: large },

  // Focus ring against what is under it — and, through the 2px surface gap
  // outline-offset leaves, the accent against every surface a solid button stands on.
  { label: 'focus: ring on page', fg: '--focus-ring', bg: ['--surface-page'], min: large },
  { label: 'focus: ring on panel', fg: '--focus-ring', bg: ['--surface-raised'], min: large },
  { label: 'focus: ring in inset', fg: '--focus-ring', bg: ['--surface-sunken'], min: large },
  { label: 'focus: gap around the ring, on page', fg: '--accent-solid', bg: ['--surface-page'], min: large },
  { label: 'focus: gap around the ring, on panel', fg: '--accent-solid', bg: ['--surface-raised'], min: large },
  { label: 'focus: gap around the ring, in inset', fg: '--accent-solid', bg: ['--surface-sunken'], min: large },

  // Surface stack steps — depth is carried by lightness order, measured in OKLCH.
  { label: 'stack: page over recess', fg: '--surface-page', bg: ['--surface-sunken'], min: step },
  { label: 'stack: panel over page', fg: '--surface-raised', bg: ['--surface-page'], min: step },
  { label: 'stack: panel over recess', fg: '--surface-raised', bg: ['--surface-sunken'], min: step },
  { label: 'stack: card in panel', fg: '--surface-sunken', bg: ['--surface-raised'], min: step },

  // The weight ladder: soft must be QUIETER than default, not merely different.
  {
    label: 'ladder: soft against default',
    fg: '--surface-recessed-hover',
    bg: ['--surface-raised'],
    alt: ['--surface-raised', '--surface-recessed'],
    min: step,
  },

  // The default button against what it sits on — its ONLY distinguishing feature.
  { label: 'button against panel', fg: '--surface-recessed', bg: ['--surface-raised'], min: step },
  { label: 'button against page', fg: '--surface-recessed', bg: ['--surface-page'], min: step },

  // Rank: a support region recedes at the same depth, and its text still reads.
  { label: 'rank: support region on page', fg: '--region-ground-support', bg: ['--surface-page'], min: step },
  { label: 'rank: support region on panel', fg: '--region-ground-support', bg: ['--surface-raised'], min: step },
  { label: 'rank: text in a nested support region', fg: '--text-primary', bg: ['--surface-raised', '--surface-recessed', '--region-ground-support'], min: text },
  { label: 'rank: support title in a nested support region', fg: '--text-muted', bg: ['--surface-raised', '--surface-recessed', '--region-ground-support'], min: text },
  { label: 'rank: support title on page', fg: '--text-muted', bg: ['--surface-page', '--region-ground-support'], min: text },

  // Tone on a region's ground: the raised surface, not only the page.
  { label: 'region tone: text on ok ground', fg: '--text-primary', bg: ['--surface-raised', '--ok-bg'], min: text },
  { label: 'region tone: text on warn ground', fg: '--text-primary', bg: ['--surface-raised', '--warn-bg'], min: text },
  { label: 'region tone: text on error ground', fg: '--text-primary', bg: ['--surface-raised', '--err-bg'], min: text },
  { label: 'region tone: text on running ground', fg: '--text-primary', bg: ['--surface-raised', '--accent-bg'], min: text },
  { label: 'region tone: name on error ground', fg: '--text-muted', bg: ['--surface-raised', '--err-bg'], min: text },
  { label: 'region tone: name on warn ground', fg: '--text-muted', bg: ['--surface-raised', '--warn-bg'], min: text },
]

export default defineThemeCheck({
  name: 'Instrument',
  dir: 'theme-instrument',
  tokenDirs: ['tokens'],
  contexts,
  pairs,
  // FROZEN. Instrument proved the kit's structure/theme split, and it keeps
  // proving it for everything below; components added after the freeze (the
  // table onward) are GGarry's only. See the README, "Themes".
  components: [
    'avatar',
    'badge',
    'banner',
    'breadcrumbs',
    'button',
    'button-group',
    'card',
    'checkbox',
    'checkbox-group',
    'chip',
    'chip-group',
    'choice-card',
    'dialog',
    'empty-state',
    'field',
    'fieldset',
    'file-drop',
    'input',
    'input-group',
    'menu',
    'menubar',
    'nav',
    'note',
    'number-field',
    'pagination',
    'panel',
    'popover',
    'radio-group',
    'search',
    'segmented-control',
    'select',
    'skeleton',
    'slider',
    'spinner',
    'steps',
    'switch',
    'tabs',
    'textarea',
    'toast',
    'toolbar',
    'tooltip',
  ],
})
