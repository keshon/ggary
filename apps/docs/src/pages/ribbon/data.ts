/** What the ribbon demos share: scene tabs and the tools that overflow. */
import type { RibbonItem } from '@ggary/core/ribbon'
import type { SegmentedItem } from '@ggary/core/segmented-control'
import type { SelectItem } from '@ggary/core/select'
import type { IconName } from '@ggary/icons'

export const sceneTabs: RibbonItem[] = [
  { value: 'model', label: 'Model' },
  { value: 'modify', label: 'Modify' },
  { value: 'animate', label: 'Animate' },
]

export const sceneTabsWithLocked: RibbonItem[] = [
  { value: 'model', label: 'Model' },
  { value: 'modify', label: 'Modify' },
  { value: 'animate', label: 'Animate (disabled)', disabled: true },
]

export const levels: SelectItem[] = [
  { value: 'base', label: 'Base' },
  { value: 'mid', label: 'Mid' },
  { value: 'high', label: 'High' },
]

export const snapModes: SegmentedItem[] = [
  { value: 'grid', label: 'Grid' },
  { value: 'vertex', label: 'Vertex' },
  { value: 'edge', label: 'Edge' },
]

/** More tabs than fit: the tab row scrolls, with fades where it runs on. */
export const toolTabs: RibbonItem[] = [
  { value: 'tools', label: 'Tools' },
  { value: 'edit', label: 'Edit' },
  { value: 'view', label: 'View' },
  { value: 'create', label: 'Create' },
  { value: 'modify', label: 'Modify' },
  { value: 'animate', label: 'Animate' },
  { value: 'render', label: 'Render' },
  { value: 'simulate', label: 'Simulate' },
  { value: 'script', label: 'Script' },
  { value: 'help', label: 'Help' },
]

/** More groups than fit: the panel scrolls sideways, under the wheel too. */
export const overflowGroups: { label: string; tools: { icon: IconName; name: string }[] }[] = [
  { label: 'Edit', tools: [{ icon: 'cut', name: 'Cut' }, { icon: 'copy', name: 'Copy' }, { icon: 'paste', name: 'Paste' }] },
  { label: 'History', tools: [{ icon: 'undo', name: 'Undo' }, { icon: 'redo', name: 'Redo' }, { icon: 'save', name: 'Save' }] },
  { label: 'Change', tools: [{ icon: 'edit', name: 'Edit' }, { icon: 'trash', name: 'Delete' }, { icon: 'filter', name: 'Filter' }] },
  { label: 'Order', tools: [{ icon: 'sort', name: 'Sort' }, { icon: 'grid', name: 'Grid' }, { icon: 'globe', name: 'Globe' }] },
  { label: 'View', tools: [{ icon: 'zoom-in', name: 'Zoom in' }, { icon: 'zoom-out', name: 'Zoom out' }, { icon: 'expand', name: 'Expand' }] },
  { label: 'Share', tools: [{ icon: 'download', name: 'Download' }, { icon: 'upload', name: 'Upload' }, { icon: 'share', name: 'Share' }] },
  { label: 'Find', tools: [{ icon: 'search', name: 'Search' }, { icon: 'pin', name: 'Pin' }, { icon: 'settings', name: 'Settings' }] },
  { label: 'Play', tools: [{ icon: 'play', name: 'Play' }, { icon: 'stop', name: 'Stop' }, { icon: 'skip', name: 'Skip' }] },
  { label: 'Align', tools: [{ icon: 'sidebar', name: 'Sidebar' }, { icon: 'columns', name: 'Columns' }, { icon: 'list', name: 'List' }] },
  { label: 'Send', tools: [{ icon: 'send', name: 'Send' }, { icon: 'archive', name: 'Archive' }, { icon: 'pin', name: 'Pin' }] },
]
