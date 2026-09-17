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
