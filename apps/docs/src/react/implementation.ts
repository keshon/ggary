/** Current React ownership; composite boundaries are described explicitly. */
export interface Implementation { label: string; detail: string; decision: string }
const base = new Set(['select', 'combobox', 'dialog', 'sheet', 'popover', 'tooltip', 'menu', 'menubar', 'context-menu', 'tabs', 'accordion', 'slider', 'number-field'])
const composites: Record<string, string> = {
  'date-picker': 'GGary calendar/parsing; Base UI Popover and native Field.Control constraints. DateTime shares one canonical field.',
  'time-picker': 'GGary time parsing/navigation; Base UI Combobox boundary and native Field.Control constraints.',
  'range-slider': 'Base UI owns slider interaction and thumb collisions; GGary adds marks, bubbles and editable range fields.',
  cascader: 'GGary tree selection; Base UI Popover boundary.',
  'command-palette': 'GGary command/search logic; Base UI Dialog boundary.',
  popconfirm: 'GGary confirmation API; Base UI Popover boundary.',
  'data-grid': 'GGary grid behavior; internal menus use Base UI.',
  kanban: 'GGary board behavior; internal menus use Base UI.',
}
const native = new Set(['button', 'input', 'textarea', 'checkbox', 'switch'])
const migrate = new Set(['tabs', 'accordion', 'slider', 'range-slider', 'number-field'])
const forms = new Set(['form', 'field', 'fieldset', 'input', 'checkbox', 'checkbox-group', 'radio-group', 'switch'])
const review = new Set(['toast', 'toaster', 'toolbar', 'avatar', 'progress', 'meter', 'button', 'button-group'])
export function implementationFor(id: string): Implementation {
  const decision = migrate.has(id) ? 'Next: migrate interaction to Base UI.'
    : forms.has(id) ? 'Next: review within the form architecture.'
    : review.has(id) ? 'Next: evaluate Base UI benefit before changing.'
    : 'Retain; review custom behavior and composition as needed.'
  if (id === 'shell') return { label: 'GGary + Base UI', detail: 'GGary responsive application layout; Base UI Dialog owns the mobile drawer focus and dismissal. The sidebar stays mounted across resizing.', decision: 'Mobile drawer migrated; desktop and bar modes remain layout.' }
  if (id === 'anchor') return { label: 'GGary + Base UI', detail: 'GGary tracks the current page section and responsive layout. Base UI Popover manages the floating list, dismissal and focus.', decision: 'Floating panel migrated; scroll tracking stays GGary domain behavior.' }
  if (id === 'ribbon') return { label: 'GGary + Base UI', detail: 'Base UI Tabs owns tab selection and focus; named button groups use Base UI Toolbar. GGary retains controlled requests, panel composition and horizontal scrolling.', decision: 'Use ToolbarButton in managed RibbonGroup; set managed=false for mixed controls with their own focus behavior.' }
  if (id === 'avatar') return { label: 'Base UI + GGary presentation', detail: 'Base UI owns image loading and fallback visibility; GGary keeps initials, accessible names, sizes and AvatarGroup.', decision: 'Migrated; preserve source-change and failed-image coverage.' }
  if (id === 'button' || id === 'button-group') return { label: 'Native HTML + GGary', detail: 'Native button semantics with GGary loading and visual variants; ButtonGroup is layout.', decision: 'Retain: no substantial custom keyboard behavior to replace.' }
  if (id === 'progress' || id === 'meter') return { label: 'GGary semantics + presentation', detail: 'GGary supplies ARIA values and formatted bar/ring presentation; no focus or keyboard state machine.', decision: 'Retain for now; audit semantic bounds separately before considering Base UI.' }
  if (id === 'toolbar') return { label: 'Base UI + GGary presentation', detail: 'Named Toolbar uses Base UI roving focus with explicit ToolbarButton registration. GGary keeps button styling, separators, spacers and unnamed layout strips.', decision: 'Migrated; use ToolbarButton for named toolbar actions. Other item types need explicit primitives before support is claimed.' }
  if (id === 'toast' || id === 'toaster') return { label: 'Base UI + GGary presentation', detail: 'Base UI owns the React queue, expiry, pause, limits, announcements and dismissal. GGary maps imperative toast/update/dismiss calls and retains tones, styling and native top-layer placement.', decision: 'Migrated; use the React createToaster export with one mounted Toaster per queue. Core/Svelte stores are separate.' }
  if (id === 'cascader') return { label: 'GGary + Base UI', detail: 'GGary tree navigation and path selection; Base UI Popover and Field.Control boundaries. A native constraint input validates and submits the accepted terminal value. Field owns labels, naming, errors and summary focus.', decision: 'Form composition audited: required, disabled paths, read-only browsing, reset and accepted/refused edits.' }
  if (id === 'combobox') return { label: 'Base UI + GGary extensions', detail: 'Base UI selection, keyboard interaction and canonical form inputs; GGary retains ranked/remote search and creation. Field owns naming, labels and errors. Required validates selected values, never search text.', decision: 'Form composition audited, including multiple values, read-only mutations and accepted/refused edits.' }
  if (id === 'select') return { label: 'Base UI', detail: 'Base UI selection, keyboard navigation and native constraints with GGary styling. Field owns the label, name and error disclosure when composed; disabled Fieldset and read-only state are inherited.', decision: 'Select form composition audited; maintain accepted/refused edit and submission coverage.' }
  if (id === 'field') return { label: 'Base UI + GGary policy', detail: 'Base UI Field owns constraint computation and label registration. GGary keeps hint/error slots, blur/live error timing, form errors and reset visibility.', decision: 'Custom native controls use FieldControl; option groups use a named Fieldset.' }
  if (id === 'input') return { label: 'Base UI + GGary extensions', detail: 'Base UI Input registers with Field; GGary keeps styling, the value-only callback and password reveal.', decision: 'Migrated; maintain validation and reset coverage.' }
  if (id === 'textarea') return { label: 'GGary + Base UI', detail: 'A native textarea rendered through Base UI Field.Control; GGary adds autosizing and presentation.', decision: 'Migrated; maintain validation and reset coverage.' }
  if (id === 'search') return { label: 'GGary + Base UI', detail: 'GGary search presentation around Base UI Input, with Field validation registration.', decision: 'Migrated; maintain integration coverage.' }
  if (id === 'checkbox' || id === 'switch') return { label: 'Base UI + GGary extensions', detail: 'Base UI owns activation, visible-control focus and Field registration. GGary keeps styling, reset, boolean callbacks and its Checkbox mixed-state API; the ref points to the submission input.', decision: 'Migrated; maintain group and form integration coverage.' }
  if (id === 'checkbox-group') return { label: 'Base UI + GGary policy', detail: 'Base UI owns checkbox group selection. GGary keeps item-order values, reset and aggregate native constraints; required means at least one enabled checked option.', decision: 'Migrated; maintain group and form integration coverage.' }
  if (id === 'radio-group') return { label: 'Base UI + GGary policy', detail: 'Base UI owns radio selection and roving keyboard focus. GGary keeps styling, the value-only callback, reset and Fieldset validation timing; native inputs submit the value.', decision: 'Migrated; maintain group and form integration coverage.' }
  if (id === 'fieldset') return { label: 'Base UI + GGary policy', detail: 'Base UI Fieldset and Legend provide semantics and disabled composition. GGary aggregates native validity and reveals errors on leaving the group or a submit attempt.', decision: 'Use name to connect grouped values to Form errors and summary links.' }
  if (id === 'file-drop') return { label: 'Native HTML + Base UI Field', detail: 'GGary native control behavior and presentation; Base UI Field.Control registers constraints. File selection and drop behavior remain GGary features.', decision: 'Field integration complete; interaction-counterpart review remains.' }
  if (id === 'form') return { label: 'Native HTML + GGary', detail: 'GGary deliberately owns async validation, native submission, server errors and summary-first focus. Base UI Field/control primitives register native constraints. Edits are coalesced after React commits accepted values; there is no legacy event bridge.', decision: 'Retain this single workflow; Base UI Form would duplicate validation and focus ownership.' }
  if (id === 'number-field') return { label: 'Base UI', detail: 'Base UI text editor, numeric stepping and axis scrubbing; a hidden numeric input submits the value.', decision: 'Migrated; review Field integration in the form phase.' }
  if (id === 'tabs') return { label: 'Base UI + GGary extensions', detail: 'Base UI tab selection and navigation; GGary document closing. Disabled tabs can receive arrow focus but cannot activate.', decision: 'Migrated; maintain integration coverage.' }
  if (id === 'accordion') return { label: 'Base UI + GGary extensions', detail: 'Base UI disclosure and find-in-page; GGary non-collapsible option. Navigate headings with Tab, not arrow shortcuts.', decision: 'Migrated; maintain integration coverage.' }
  if (base.has(id)) return { label: 'Base UI', detail: 'Base UI interaction primitive with GGary styling and public API.', decision: 'Migrated; maintain integration coverage.' }
  if (id === 'range-slider') return { label: 'GGary + Base UI', detail: composites[id], decision: 'Compound Field audited: two canonical endpoints, isolated draft editors, read-only, disabled, reset and summary focus.' }
  if (composites[id]) return { label: 'GGary + Base UI', detail: composites[id], decision }
  if (native.has(id)) return { label: 'Native HTML + GGary', detail: 'Native semantic control with GGary state, integration and styling. Not a Base UI adapter.', decision }
  return { label: 'GGary custom', detail: 'GGary implementation; this label does not imply custom keyboard behavior in purely presentational components.', decision }
}

/** Consumer guidance, kept separate from migration decisions and ownership. */
export function usageFor(id: string): string | undefined {
  const notes: Record<string, string> = {
    ribbon: 'Button groups support arrow-key navigation. Use ToolbarButton for their actions. For groups containing selects or other controls, set managed={false} so those controls retain their keyboard behavior.',
    toolbar: 'Give action toolbars a label and use ToolbarButton for their buttons to enable arrow-key navigation. Omit the label for a simple layout strip.',
    toast: 'Create a queue with the React createToaster export and mount one Toaster for that queue. Call toast, update or dismiss to manage notifications.',
    toaster: 'Create a queue with the React createToaster export and mount one Toaster for that queue.',
    field: 'Wrap a control in Field to connect its label, hint and validation messages. Use FieldControl for a custom native input.',
    fieldset: 'Use a named Fieldset for grouped form values, such as checkbox or radio options.',
    form: 'Give controls names for submission and errors. Form supports asynchronous validation and server errors.',
  }
  return notes[id]
}
export function implementationBadge(label: string): string {
  return label.includes('Base UI') ? 'Built with Base UI'
    : label.includes('Native HTML') ? 'Native HTML'
    : 'GGary component'
}
