import { afterEach, describe } from 'vitest'
import { react } from './adapters/react'
import { svelte } from './adapters/svelte'
import { buttonConformance } from './button.spec'
import { checkboxConformance, switchConformance } from './checkbox.spec'
import { chipGroupConformance } from './chip-group.spec'
import { numberFieldConformance, segmentedControlConformance, sliderConformance } from './controls.spec'
import { dialogConformance } from './dialog.spec'
import { fieldConformance } from './field.spec'
import { buttonGroupConformance, choiceCardsConformance, fileDropConformance, inputGroupConformance, searchConformance } from './fields.spec'
import { checkboxGroupConformance, fieldsetConformance } from './fieldset.spec'
import { cleanup } from './harness'
import { inputConformance } from './input.spec'
import { menuConformance } from './menu.spec'
import { dataGridConformance, gridRowsConformance, gridToolsConformance } from './data-grid.spec'
import { flowConformance, layoutConformance } from './layout.spec'
import { comboboxConformance } from './combobox.spec'
import { cascaderConformance } from './cascader.spec'
import { disclosureConformance } from './disclosure.spec'
import { kanbanConformance } from './kanban.spec'
import { commandPaletteConformance } from './command-palette.spec'
import { formConformance } from './form.spec'
import { ganttConformance } from './gantt.spec'
import { calendarConformance, datePickerConformance } from './date-picker.spec'
import { breadcrumbsConformance, navConformance, paginationConformance, stepsConformance, toolbarConformance } from './navigation.spec'
import { menubarConformance } from './menubar.spec'
import { popoverConformance, tooltipConformance } from './popover.spec'
import { radioGroupConformance } from './radio-group.spec'
import { resetConformance } from './reset.spec'
import { selectConformance } from './select.spec'
import { tabsConformance } from './tabs.spec'
import { toastConformance } from './toast.spec'
import { displayConformance } from './display.spec'
import { typographyConformance } from './typography.spec'
import { feedbackConformance } from './feedback.spec'
import { timeConformance } from './time.spec'
import { meterConformance } from './meter.spec'
import { ringConformance } from './ring.spec'
import { codeConformance } from './code.spec'
import { insertsConformance } from './inserts.spec'
import { dataDisplayConformance } from './data-display.spec'
import { legendConformance, sparklineConformance } from './charts.spec'
import { shareConformance } from './share.spec'
import { heatmapConformance } from './heatmap.spec'
// The Run component's spec, aliased: this file's own entry point is runConformance().
import { budgetConformance, historyConformance, queueConformance, runConformance as agentRunConformance, diffConformance, lanesConformance, logConformance, stepConformance } from './agent.spec'
import { textareaConformance } from './textarea.spec'
import { timelineConformance } from './timeline.spec'
import { approvalConformance, composerConformance, failureConformance, thinkingConformance, turnConformance } from './chat.spec'

/**
 * One contract, every adapter. A failure reads as `react > select > keyboard >
 * skips disabled options`, which names the adapter that drifted.
 *
 * Run twice: under jsdom (conformance.dom.test.ts), fast and everywhere, and in
 * a real Chromium (conformance.browser.test.ts), where layout, focus, the top
 * layer and events are the browser's own rather than a simulation's.
 */
export function runConformance() {
  afterEach(cleanup)

  for (const adapter of [react, svelte]) {
    describe(adapter.name, () => {
      buttonConformance(adapter)
      selectConformance(adapter)
      chipGroupConformance(adapter)
      inputConformance(adapter)
      textareaConformance(adapter)
      checkboxConformance(adapter)
      switchConformance(adapter)
      radioGroupConformance(adapter)
      segmentedControlConformance(adapter)
      sliderConformance(adapter)
      numberFieldConformance(adapter)
      choiceCardsConformance(adapter)
      searchConformance(adapter)
      inputGroupConformance(adapter)
      fileDropConformance(adapter)
      buttonGroupConformance(adapter)
      breadcrumbsConformance(adapter)
      navConformance(adapter)
      paginationConformance(adapter)
      stepsConformance(adapter)
      toolbarConformance(adapter)
      dataGridConformance(adapter)
      gridToolsConformance(adapter)
      gridRowsConformance(adapter)
      layoutConformance(adapter)
      flowConformance(adapter)
      comboboxConformance(adapter)
      cascaderConformance(adapter)
      disclosureConformance(adapter)
      kanbanConformance(adapter)
      commandPaletteConformance(adapter)
      formConformance(adapter)
      ganttConformance(adapter)
      calendarConformance(adapter)
      datePickerConformance(adapter)
      checkboxGroupConformance(adapter)
      fieldsetConformance(adapter)
      resetConformance(adapter)
      fieldConformance(adapter)
      dialogConformance(adapter)
      popoverConformance(adapter)
      tooltipConformance(adapter)
      menuConformance(adapter)
      menubarConformance(adapter)
      tabsConformance(adapter)
      toastConformance(adapter)
      displayConformance(adapter)
      typographyConformance(adapter)
      feedbackConformance(adapter)
      timeConformance(adapter)
      meterConformance(adapter)
      ringConformance(adapter)
      timelineConformance(adapter)
      codeConformance(adapter)
      insertsConformance(adapter)
      dataDisplayConformance(adapter)
      sparklineConformance(adapter)
      legendConformance(adapter)
      shareConformance(adapter)
      heatmapConformance(adapter)
      turnConformance(adapter)
      composerConformance(adapter)
      thinkingConformance(adapter)
      approvalConformance(adapter)
      failureConformance(adapter)
      agentRunConformance(adapter)
      queueConformance(adapter)
      historyConformance(adapter)
      budgetConformance(adapter)
      stepConformance(adapter)
      logConformance(adapter)
      diffConformance(adapter)
      lanesConformance(adapter)
    })
  }
}
