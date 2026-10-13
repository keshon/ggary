# GGary visual and UX audit

Inspected locally on 2026-10-13 against main revision `1752e63`; fixes were then applied in the same working tree.

The design language is coherent across React and Svelte. The initial pass found concrete responsive and popup UX defects; the remediation pass resolved all twelve findings without a broad visual redesign.

## Remediation status

All findings V01-V12 are fixed and rechecked in both framework docs at 320, 390, 768 and 1440px. The affected pages no longer widen the document. Open-state checks also confirmed that React/Svelte Cascader reveal the selected leaf, Svelte TimePicker reveals the selected time, and Svelte nested menus remain inside the phone viewport.

- V01-V03: calendar months wrap at a readable width, tables own their horizontal scroll, and Shell bar navigation keeps intrinsic item widths.
- V04-V05: narrow Svelte submenus fall below their trigger when neither side fits; TimePicker centers its selected/highlighted option in its own scroller.
- V06-V07 and V11: Panel, static overlay previews, and Sheet form composition now have explicit container sizing and spacing.
- V08-V10 and V12: Slider labels suppress only colliding text while keeping ticks, Cascader reveals the active column after popup layout, Combobox actions stay in a trailing group, and compact Pagination keeps previous/current/next together.

## Coverage

- All **111 demo pages**, both frameworks, light mode at **1440x900** and **390x844**: **444 full-page captures**, visually scanned as overviews.
- **22 representative pages per framework** also scanned in dark mode: **44 captures**. Dark coverage is sampled.
- Geometry checks at **320px** for ten responsive hotspots per framework.
- Full-size inspection of suspected defects and sampled opened/keyboard states for select, combobox, cascader, date/time pickers, menus, context menu, menubar, popover, popconfirm, command palette, dialog, sheet, shell drawer, tooltip and tabs. Interactive coverage differs by framework; see the coverage file.
- Contact sheets establish overview coverage. They do not certify every small detail or every interaction state. Capturing a screenshot alone is not a pass.
- Chromium desktop browser. Touch hardware, Safari/Firefox, enlarged text/zoom, exhaustive hover/error/loading permutations, measured contrast and screen-reader testing are outside this pass.

[Per-page coverage](audits/2026-10-13/coverage.json) records inspected widths, dark samples, interaction evidence and findings. No finding means no issue observed in the inspected baseline, not an unconditional UX approval.

## Fix before visual sign-off

### V01 - Two-month Calendar geometry fails on narrow containers

**High. React and Svelte; responsive component issue.**

At 390px, standalone Svelte Calendar widens the page to about 585px. React squeezes two months into the container: weekday headings collide and selected discs cover neighboring day labels. React DatePicker has the same compressed geometry in its two-month popup. Svelte DatePicker already stacks its popup months, but standalone Calendar does not. At 320px, both standalone pages overflow.

Keep a usable minimum month width and wrap/stack months according to container space. Apply that policy consistently to standalone and popup calendars; preserve range preview caps. Start in `packages/structure/src/calendar.css` and the calendar adapters/theme rules.

[React calendar](audits/2026-10-13/evidence/evidence-react-calendar-narrow.png), [Svelte calendar](audits/2026-10-13/evidence/evidence-svelte-calendar-narrow.png), [React popup](audits/2026-10-13/evidence/state-react-390-date-two-months.png).

### V02 - Table widens the whole phone page

**High. React and Svelte; responsive integration issue.**

At 390px, document width reaches about 591px. Updated/actions columns leave the viewport. DataGrid and Gantt contain their horizontal scroll instead.

Define a table-container pattern with local horizontal scrolling and keyboard access while preserving native table semantics. Use it in the demos; decide whether the container belongs in the public API. Start in `packages/structure/src/table.css` and `apps/docs/src/pages/table`.

[React](audits/2026-10-13/evidence/react-table-overflow.png), [Svelte](audits/2026-10-13/evidence/svelte-table-overflow.png).

### V03 - Shell horizontal navigation overlaps icons and labels

**High. React and Svelte; shared responsive CSS issue.**

The narrow `collapse="bar"` example compresses navigation entries: Leads/Deals icons and labels overlap, and Settings is clipped. The drawer alternative renders correctly when opened.

Keep horizontal groups/items at an intrinsic minimum width and scroll the row, or supply an overflow menu. Start in `packages/structure/src/layout.css` and `navigation.css`.

[Evidence](audits/2026-10-13/evidence/evidence-svelte-shell-bar.png).

### V04 - Svelte submenu is placed beyond the phone edge

**High. Svelte Menu; placement issue.**

At 390px, open Document, then Export as with ArrowRight. The parent starts at x149; its submenu occupies x-30..150, cutting the beginnings of PDF/PNG image/Code labels. React keeps the submenu inside the viewport.

Add a narrow-screen collision policy that shifts/overlaps or replaces the parent panel when neither side has room. Recheck Menubar nested menus as a related follow-up. Start in `packages/svelte/src/components/menu`.

[Svelte](audits/2026-10-13/evidence/state-svelte-390-menu-submenu.png), [React comparison](audits/2026-10-13/evidence/state-react-390-menu-submenu.png).

### V05 - Svelte TimePicker hides the highlighted current time

**High. Svelte; selected-item visibility issue.**

With 14:30 selected, opening by button or ArrowDown shows midnight onward. The highlighted selected option is around y2195, outside the visible content at y334..615; scrollTop is zero. React opens around 14:30.

Reveal the highlighted/selected option after popup layout. Ensure keyboard movement scrolls the actual scrolling element. Start in `packages/svelte/src/components/time-picker`.

[Svelte](audits/2026-10-13/evidence/state-svelte-390-time-picker-open.png), [React](audits/2026-10-13/evidence/state-react-390-time-picker-open.png).

## Repair the demo compositions

### V06 - Panel specimens collapse to a strip

**Medium. Both frameworks; docs composition issue.**

Thirteen normal specimens are about 1.33px wide on desktop and clip their content. Wide compositions render correctly. Panel intentionally uses inline-size containment and needs width supplied by its parent; the centered flex specimens provide none.

Give Panel specimens a bounded full width. Keep the containment contract. Start in `apps/docs/src/pages/panel` and `apps/docs/src/site.css`.

[React](audits/2026-10-13/evidence/react-panel-collapsed.png), [Svelte](audits/2026-10-13/evidence/svelte-panel-collapsed.png).

### V07 - Static Dialog/Sheet previews exceed their narrow frame

**Medium. Both frameworks; docs preview issue.**

Static previews clip headings, fields or actions. Some Sheet previews span x-47..343 or x37..427. Real launched Dialog and Sheet fit the phone viewport and show visible keyboard focus.

Size static previews against their frame, with local scrolling where required. Do not change working live overlays to compensate. Start in both `DialogSpecimen` implementations and `site.css`.

[Static Sheet](audits/2026-10-13/evidence/svelte-sheet-static-preview.png), [live Dialog](audits/2026-10-13/evidence/state-svelte-390-dialog-open.png).

## UX and responsive polish

### V08 - Formatted Slider marks collide

**Medium. Both frameworks.** At 390px, 0/4 agents labels overlap by roughly 6px and 12/16 agents by roughly 16px in Svelte; React shows the same pattern. Plain numeric marks fit. Add a label-density policy: fewer labels, alternate rows or a documented responsive mark set. Do not shrink all text to force it to fit. Start in `packages/structure/src/controls.css`, slider theme and demos.

[Evidence](audits/2026-10-13/evidence/evidence-svelte-slider-marks.png).

### V09 - Cascader opens with its selected leaf out of sight

**Medium. Both frameworks.** Opening Russia > Tatarstan > Kazan at 390px gives about 373px of content with 540px scroll width and scrollLeft zero. The Kazan column is outside the useful visible area. Reveal the active leaf column on opening/path movement, or use narrow-screen drill-down with breadcrumb/back navigation. Start in both Cascader adapters and `packages/structure/src/select.css`.

[Evidence](audits/2026-10-13/evidence/state-svelte-390-cascader-open.png).

### V10 - Multi-value Combobox global actions wrap into a loose second row

**Medium. Both frameworks.** Enterprise, Renewal and Partner push clear-all and disclosure controls to the lower left. The editor works, but action grouping is unclear. Keep global actions in a trailing group while chips/editor wrap in the remaining space. Start in shared Combobox CSS.

[Evidence](audits/2026-10-13/evidence/state-svelte-390-combobox-multiple.png).

### V11 - Svelte Sheet example lacks form rhythm

**Low. Svelte docs.** Model, Agents and Keep logs are bare siblings: the Agents label touches the previous control, and field widths differ. Use Stack/Form composition in `apps/docs/src/pages/sheet/Sheet.svelte`; field spacing belongs to the containing form layout.

[Svelte](audits/2026-10-13/evidence/state-svelte-390-sheet-open.png), [React](audits/2026-10-13/evidence/state-react-390-sheet-open.png).

### V12 - Pagination leaves Forward alone on a second line

**Low. Both frameworks.** Long-label and large examples wrap Forward onto a disconnected row at 390px. Supply a compact pagination recipe with fewer page buttons or previous/current/next. No overlap or unreachable target was observed.

## What looked sound

- Palette, typography, radii and emphasis generally remain coherent across adapters. There is no obvious competing visual language introduced by the primitive libraries.
- Most simple controls, status/display components and text/layout primitives show no obvious baseline visual defect at the inspected widths.
- Tabs hide scrollbars while End selects the final document tab and scrolls it into view. [Evidence](audits/2026-10-13/evidence/state-svelte-390-tabs-end.png).
- DataGrid, Gantt, Kanban and Heatmap contain horizontal content locally. A contained scroller still needs application-specific mobile UX decisions.
- Sampled live overlays fit the phone viewport; menu disabled/destructive states and keyboard tooltips are visually distinguishable. CommandPalette exposes an explicit Nothing matches state.

## Remaining acceptance work

The responsive remediation pass is complete. The next useful step is a separate task-flow and hierarchy review on one realistic GGary-only application screen. Leads is not required. Touch hardware, Safari/Firefox, zoomed text, exhaustive state permutations and screen-reader testing remain outside this visual pass.

## Evidence storage

Selected evidence is saved under `audits/2026-10-13/evidence`. The full capture archive and comparison sheets remain in ignored `node_modules/.cache/visual-audit`. Cache cleanup removes that archive, but preserves the selected evidence and coverage record.
