/**
 * GGarry's contrast promises.
 *
 * Written against the colours GGarry's component CSS actually paints with — the
 * coverage rule in @ggary/checks lists any it misses — and on the stacks
 * those colours actually sit on.
 */
import { LARGE, STEP, TEXT, defineThemeCheck, type Pair } from '@ggary/checks'

const pairs: Pair[] = [
  // Body text on every surface a component stands on.
  { label: 'text: default on canvas', fg: '--ggarry-text-default', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'text: default on surface', fg: '--ggarry-text-default', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'text: default on subtle', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'text: default on muted (chip)', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },

  // Labels: select and chip-group labels are read, so the text threshold.
  { label: 'label: muted on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'label: muted on canvas', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },

  // A placeholder and an empty state are READ, so they take readable text and
  // owe the text threshold. The first gate run found both on subtle text
  // (2.56:1); subtle is now decoration only, as Instrument's faint step is.
  { label: 'placeholder: muted in trigger', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'empty state: muted on canvas', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },

  // Subtle text is decoration: a disabled option, which WCAG exempts from the
  // text threshold. It still has to be visible as present, so 3:1.
  { label: 'decor: disabled option, subtle on surface', fg: '--ggarry-text-subtle', bg: ['--ggarry-bg-surface'], min: LARGE },

  // Accent text: low-emphasis button, selected-row-free accent labels.
  { label: 'accent: text on its tint (low button)', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface', '--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'accent: text on surface', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface'], min: TEXT },

  // Labels on the accent fill: high-emphasis button, selected chip, highlighted
  // option. Hover must not drop below the threshold either.
  { label: 'on accent: label on fill', fg: '--ggarry-text-on-accent', bg: ['--ggarry-bg-accent'], min: TEXT },
  { label: 'on accent: label on hover fill', fg: '--ggarry-text-on-accent', bg: ['--ggarry-bg-accent-hover'], min: TEXT },

  // High-emphasis danger: GGarry's solid red button.
  { label: 'danger: white label on fill', fg: '--ggarry-color-white', bg: ['--ggarry-bg-danger'], min: TEXT },
  { label: 'danger: white label on hover fill', fg: '--ggarry-color-white', bg: ['--ggarry-color-danger-700'], min: TEXT },

  // Danger text on the surfaces and on the 10% tint low emphasis uses. The tint
  // is written in button.css rather than as a token, so the pair spells it out.
  { label: 'danger: text on surface', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'danger: text on canvas', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-canvas'], min: TEXT },
  // Menu rows. The highlighted row reuses the accent and danger fills above.
  { label: 'menu: shortcut on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'badge: neutral word on its plate', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'badge: running word on its plate', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'badge: ok word on its plate', fg: '--ggarry-text-success', bg: ['--ggarry-bg-success-subtle'], min: TEXT },
  { label: 'badge: warn word on its plate', fg: '--ggarry-text-warning', bg: ['--ggarry-bg-warning-subtle'], min: TEXT },
  { label: 'badge: error word on its plate', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-danger-subtle'], min: TEXT },
  { label: 'badge: count on its fill', fg: '--ggarry-text-on-accent', bg: ['--ggarry-bg-accent'], min: TEXT },
  { label: 'badge: plain dot on its plate', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: LARGE },
  { label: 'avatar: initials on the disc', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  // The arc against the surface, not the track: the arc says busy, the track only draws the circle.
  { label: 'spinner: arc on the surface', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'skeleton: bar off the surface', fg: '--ggarry-border-default', bg: ['--ggarry-bg-surface'], min: STEP },
  { label: 'grid filters: the column on its chip', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'grid bulk: the count on the band', fg: '--ggarry-text-default', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'grid bulk: the offer of everything', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'grid bulk: the band edge', fg: '--ggarry-border-accent', bg: ['--ggarry-bg-surface'], min: STEP },
  { label: 'grid: a header on its band', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'grid: a cell on a hovered row', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'grid: a cell on a selected row', fg: '--ggarry-text-default', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'grid: the error over the body', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'grid: the line between rows', fg: '--ggarry-border-default', bg: ['--ggarry-bg-surface'], min: STEP },
  { label: 'breadcrumbs: the path on the page', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'breadcrumbs: the chevron between crumbs', fg: '--ggarry-text-subtle', bg: ['--ggarry-bg-canvas'], min: LARGE },
  { label: 'nav: a resting item on the column', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'nav: the current item on its tint', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'nav: a count on its plate', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },
  { label: 'pagination: a resting page on the canvas', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'pagination: the current page on its tint', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'steps: the name of a step', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'steps: the bar of a step to come', fg: '--ggarry-border-control', bg: ['--ggarry-bg-canvas'], min: LARGE },
  { label: 'steps: the bar of a step reached', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-canvas'], min: LARGE },
  { label: 'toolbar: its line under the strip', fg: '--ggarry-border-default', bg: ['--ggarry-bg-surface'], min: STEP },
  { label: 'choice card: description on its ground', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'choice card: description on the chosen ground', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'choice card: the bar of the chosen one', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-subtle'], min: LARGE },
  { label: 'search: the magnifier on the field', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'input group: affix on its plate', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'file drop: hint on the zone', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'file drop: hint on the zone under a drag', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-accent-subtle'], min: LARGE },
  { label: 'file drop: dashed edge on the zone', fg: '--ggarry-border-control', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'button group: the seam between buttons', fg: '--ggarry-border-default', bg: ['--ggarry-bg-subtle'], min: STEP },
  { label: 'segmented: resting label on the track', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'segmented: label on its hover plate', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },
  { label: 'segmented: chosen label', fg: '--ggarry-text-default', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'segmented: disabled label on the track', fg: '--ggarry-text-subtle', bg: ['--ggarry-bg-subtle'], min: LARGE },
  // The unfilled track and the thumb's ring are the slider's boundary: 3:1.
  { label: 'slider: unfilled track on surface', fg: '--ggarry-border-control', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'slider: fill on surface', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'slider: thumb ring on its white', fg: '--ggarry-bg-accent', bg: ['--ggarry-color-white'], min: LARGE },
  { label: 'number field: axis letter on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'number field: readonly value', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'region: support title on its ground', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'banner: detail on a plain ground', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'banner: detail on the running ground', fg: '--ggarry-text-default', bg: ['--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'banner: detail on the ok ground', fg: '--ggarry-text-default', bg: ['--ggarry-bg-success-subtle'], min: TEXT },
  { label: 'banner: detail on the warn ground', fg: '--ggarry-text-default', bg: ['--ggarry-bg-warning-subtle'], min: TEXT },
  { label: 'banner: detail on the error ground', fg: '--ggarry-text-default', bg: ['--ggarry-bg-danger-subtle'], min: TEXT },
  { label: 'banner: error icon on its ground', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-danger-subtle'], min: LARGE },
  { label: 'banner: warn icon on its ground', fg: '--ggarry-text-warning', bg: ['--ggarry-bg-warning-subtle'], min: LARGE },
  { label: 'banner: ok icon on its ground', fg: '--ggarry-text-success', bg: ['--ggarry-bg-success-subtle'], min: LARGE },
  { label: 'note: text on the page', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'toast: detail text on the surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'toast: action on the surface', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'toast: action on its hover tint', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface', '--ggarry-bg-accent-subtle'], min: TEXT },
  { label: 'toast: ok icon', fg: '--ggarry-text-success', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'toast: warn icon', fg: '--ggarry-text-warning', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'toast: error icon', fg: '--ggarry-text-danger', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'toast: running icon', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'tabs: resting label on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'tabs: bar under the selected tab', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'tabs: resting chip label on the track', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'tabs: chip label on its hover plate', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },
  { label: 'tabs: unsaved dot on the selected chip', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'tabs: unsaved dot on the track', fg: '--ggarry-text-accent', bg: ['--ggarry-bg-subtle'], min: LARGE },
  { label: 'menubar: item on its hover and open plate', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },
  { label: 'menu: submenu chevron on the open row plate', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-muted'], min: LARGE },
  // Disabled text is exempt from 1.4.3; it is held to the decor tier, as the
  // disabled option above. subtle on this plate failed even that (2.89:1).
  { label: 'menu: disabled row on its highlight plate', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-muted'], min: LARGE },
  {
    label: 'danger: text on its tint (low button)',
    fg: '--ggarry-text-danger',
    bg: ['--ggarry-bg-surface', 'color-mix(in oklab, var(--ggarry-bg-danger) 10%, transparent)'],
    min: TEXT,
  },

  // The low-emphasis chip is a plate and nothing else — no border — so its fill
  // has to stand off the surface it sits on, and hover has to be a visible step.
  { label: 'chip: low plate off the surface', fg: '--ggarry-bg-muted', bg: ['--ggarry-bg-surface'], min: STEP },
  { label: 'chip: hover step from the plate', fg: '--ggarry-border-default', bg: ['--ggarry-bg-muted'], min: STEP },
  { label: 'chip: label on hover plate', fg: '--ggarry-text-default', bg: ['--ggarry-border-default'], min: TEXT },

  // The high-emphasis chip: inverted plate.
  { label: 'chip: label on inverted plate', fg: '--ggarry-text-on-inverted', bg: ['--ggarry-bg-inverted'], min: TEXT },

  // Load-bearing boundary: a select trigger is recognised by its border, which
  // is therefore a non-text contrast requirement (WCAG 1.4.11), not decoration.
  // It has its own token, border-control; a button's outline is decoration (its
  // label identifies it) and keeps the quieter border-strong.
  { label: 'field: trigger border on surface', fg: '--ggarry-border-control', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'field: trigger border on canvas', fg: '--ggarry-border-control', bg: ['--ggarry-bg-canvas'], min: LARGE },

  // An invalid input's red border carries the error state on its own (the
  // message may be absent), so it is load-bearing too.
  { label: 'field: invalid border on surface', fg: '--ggarry-border-danger', bg: ['--ggarry-bg-surface'], min: LARGE },
  // Readonly inputs sit on the subtle surface and keep full-colour, readable text.
  { label: 'field: readonly text on subtle', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },

  // Choice controls. The checked fill IS the state, so it holds 3:1 on the
  // surface; the unchecked box is its border-control edge, measured above. The
  // switch track is filled with border-control when off, and the white thumb
  // has to read against both tracks — it is the part that says where it is.
  { label: 'choice: checked fill on surface', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'choice: checked fill on canvas', fg: '--ggarry-bg-accent', bg: ['--ggarry-bg-canvas'], min: LARGE },
  { label: 'choice: mark on checked fill', fg: '--ggarry-text-on-accent', bg: ['--ggarry-bg-accent'], min: LARGE },
  { label: 'switch: off track on surface', fg: '--ggarry-border-control', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'switch: thumb on off track', fg: '--ggarry-color-white', bg: ['--ggarry-border-control'], min: LARGE },
  { label: 'switch: thumb on on track', fg: '--ggarry-color-white', bg: ['--ggarry-bg-accent'], min: LARGE },

  // Dialog: its text sits on the surface, covered above; the description is
  // muted text on it. The scrim is decoration, the dialog's border is not the
  // boundary (its surface and shadow are).
  { label: 'dialog: description on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'dialog: close glyph on its hover', fg: '--ggarry-text-default', bg: ['--ggarry-bg-surface', '--ggarry-bg-subtle'], min: LARGE },

  // Tooltip: small text on the inverted plate, read at a glance.
  { label: 'tooltip: text on inverted plate', fg: '--ggarry-text-on-inverted', bg: ['--ggarry-bg-inverted'], min: TEXT },

  // Focus ring against what it stands on.
  { label: 'focus: ring on surface', fg: '--ggarry-focus-ring', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'focus: ring on canvas', fg: '--ggarry-focus-ring', bg: ['--ggarry-bg-canvas'], min: LARGE },
]

export default defineThemeCheck({
  name: 'GGarry',
  dir: 'theme-ggarry',
  contexts: [
    { label: 'light', attributes: {} },
    { label: 'dark', attributes: { 'data-mode': 'dark' } },
  ],
  pairs,
})
