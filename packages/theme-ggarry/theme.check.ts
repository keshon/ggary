/**
 * GGarry's contrast promises.
 *
 * Written against the colours GGarry's component CSS actually paints with — the
 * coverage rule in @ggary/checks lists any it misses — and on the stacks
 * those colours actually sit on.
 */
import { LARGE, TEXT, defineThemeCheck, type Pair, type Waiver } from '@ggary/checks'

const pairs: Pair[] = [
  // Body text on every surface a component stands on.
  { label: 'text: default on canvas', fg: '--ggarry-text-default', bg: ['--ggarry-bg-canvas'], min: TEXT },
  { label: 'text: default on surface', fg: '--ggarry-text-default', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'text: default on subtle', fg: '--ggarry-text-default', bg: ['--ggarry-bg-subtle'], min: TEXT },
  { label: 'text: default on muted (chip)', fg: '--ggarry-text-default', bg: ['--ggarry-bg-muted'], min: TEXT },

  // Labels: select and chip-group labels are read, so the text threshold.
  { label: 'label: muted on surface', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'label: muted on canvas', fg: '--ggarry-text-muted', bg: ['--ggarry-bg-canvas'], min: TEXT },

  // Subtle text is used for a select's placeholder and a group's empty state.
  // Both are READ, so they owe the text threshold — the same rule Instrument
  // writes down: its faint step is for decoration, never for text.
  { label: 'placeholder: subtle in trigger', fg: '--ggarry-text-subtle', bg: ['--ggarry-bg-surface'], min: TEXT },
  { label: 'empty state: subtle on canvas', fg: '--ggarry-text-subtle', bg: ['--ggarry-bg-canvas'], min: TEXT },

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
  {
    label: 'danger: text on its tint (low button)',
    fg: '--ggarry-text-danger',
    bg: ['--ggarry-bg-surface', 'color-mix(in oklab, var(--ggarry-bg-danger) 10%, transparent)'],
    min: TEXT,
  },

  // The high-emphasis chip: inverted plate.
  { label: 'chip: label on inverted plate', fg: '--ggarry-text-on-inverted', bg: ['--ggarry-bg-inverted'], min: TEXT },

  // Load-bearing boundary: a select trigger is recognised by its border, which
  // is therefore a non-text contrast requirement (WCAG 1.4.11), not decoration.
  { label: 'field: trigger border on surface', fg: '--ggarry-border-strong', bg: ['--ggarry-bg-surface'], min: LARGE },

  // Focus ring against what it stands on.
  { label: 'focus: ring on surface', fg: '--ggarry-focus-ring', bg: ['--ggarry-bg-surface'], min: LARGE },
  { label: 'focus: ring on canvas', fg: '--ggarry-focus-ring', bg: ['--ggarry-bg-canvas'], min: LARGE },
]

/**
 * Known failures, found by the first run of the gate against GGarry's palette.
 *
 * They are WAIVED, not fixed, because every fix changes how GGarry looks, and
 * that is a design decision rather than a mechanical one. Each waiver names the
 * cause and a measured candidate fix. A waiver whose pair starts passing fails
 * the gate, so fixing a token forces the waiver out with it.
 */
const PALETTE_DECISION = 'GGarry palette, awaiting a design decision.'

const waivers: Waiver[] = [
  // Subtle text (slate-400 light, slate-500 dark) is used for READ text.
  // Candidate: placeholder and empty state move to --ggarry-text-muted (4.76:1
  // light, 6.96:1 dark); subtle stays for decoration, darkened to about #8492a6
  // (3.16:1) so the contract's faint step clears 3:1.
  { pair: 'contract: faint on page', context: 'light', reason: `${PALETTE_DECISION} text-subtle #94a3b8 is 2.56:1; ~#8492a6 gives 3.16:1.` },
  { pair: 'contract: faint on surface', context: 'light', reason: `${PALETTE_DECISION} as above.` },
  { pair: 'placeholder: subtle in trigger', reason: `${PALETTE_DECISION} placeholder should read text-muted (4.76:1 light, 6.96:1 dark).` },
  { pair: 'empty state: subtle on canvas', reason: `${PALETTE_DECISION} empty state should read text-muted.` },

  // The select trigger's border is its only boundary. Candidate: about #8492a6
  // light (3.16:1) and slate-500 dark (3.75:1).
  { pair: 'field: trigger border on surface', reason: `${PALETTE_DECISION} border-strong is 1.48:1 light, 2.36:1 dark.` },

  // Dark mode fills are one step too light for a white label, and hover goes
  // LIGHTER — towards the label — which Instrument's rule forbids for exactly
  // this reason. Candidate: fill brand-600 (5.23:1), hover brand-700 (7.31:1),
  // danger fill danger-600 (4.83:1).
  { pair: 'on accent: label on fill', context: 'dark', reason: `${PALETTE_DECISION} white on brand-500 is 3.58:1; brand-600 gives 5.23:1.` },
  { pair: 'on accent: label on hover fill', context: 'dark', reason: `${PALETTE_DECISION} hover lightens to brand-400 (2.48:1); brand-700 gives 7.31:1.` },
  { pair: 'danger: white label on fill', context: 'dark', reason: `${PALETTE_DECISION} white on #ef4444 is 3.76:1; danger-600 gives 4.83:1.` },

  // Light low-emphasis danger: the 10% tint lowers red text to 4.14:1.
  // Candidate: text danger-700 on the tint (5.54:1).
  { pair: 'danger: text on its tint (low button)', context: 'light', reason: `${PALETTE_DECISION} #dc2626 on its tint is 4.14:1; #b91c1c gives 5.54:1.` },
]

export default defineThemeCheck({
  name: 'GGarry',
  dir: 'theme-ggarry',
  contexts: [
    { label: 'light', attributes: {} },
    { label: 'dark', attributes: { 'data-mode': 'dark' } },
  ],
  pairs,
  waivers,
})
