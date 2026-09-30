/**
 * The site's one list of pages. The navigation, the order of the pages and
 * the README's list of components are all read from it; a page is a folder
 * in src/pages with the same id, holding one demo per framework.
 *
 * A component that can be used on its own has a page of its own. Parts that
 * only work inside another (ListItem, Column) are shown on their parent's.
 */
export interface DocPage {
  /** The route and the folder: #/button, src/pages/button. */
  id: string
  title: string
}

export interface DocGroup {
  title: string
  pages: DocPage[]
}

export const MANIFEST: DocGroup[] = [
  {
    title: 'Actions',
    pages: [
      { id: 'button', title: 'Button' },
      { id: 'button-group', title: 'ButtonGroup' },
      { id: 'chip', title: 'Chip' },
      { id: 'chip-group', title: 'ChipGroup' },
      { id: 'menu', title: 'Menu' },
      { id: 'menubar', title: 'Menubar' },
      { id: 'context-menu', title: 'ContextMenu' },
      { id: 'command-palette', title: 'CommandPalette' },
    ],
  },
  {
    title: 'Inputs',
    pages: [
      { id: 'field', title: 'Field' },
      { id: 'input', title: 'Input' },
      { id: 'textarea', title: 'Textarea' },
      { id: 'search', title: 'Search' },
      { id: 'input-group', title: 'InputGroup' },
      { id: 'number-field', title: 'NumberField' },
      { id: 'checkbox', title: 'Checkbox' },
      { id: 'checkbox-group', title: 'CheckboxGroup' },
      { id: 'switch', title: 'Switch' },
      { id: 'radio-group', title: 'RadioGroup' },
      { id: 'choice-card-group', title: 'ChoiceCardGroup' },
      { id: 'segmented-control', title: 'SegmentedControl' },
      { id: 'select', title: 'Select' },
      { id: 'combobox', title: 'Combobox' },
      { id: 'cascader', title: 'Cascader' },
      { id: 'date-picker', title: 'DatePicker' },
      { id: 'calendar', title: 'Calendar' },
      { id: 'time-picker', title: 'TimePicker' },
      { id: 'slider', title: 'Slider' },
      { id: 'range-slider', title: 'RangeSlider' },
      { id: 'file-drop', title: 'FileDrop' },
      { id: 'upload', title: 'Upload' },
      { id: 'fieldset', title: 'Fieldset' },
      { id: 'form', title: 'Form' },
    ],
  },
  {
    title: 'Overlays',
    pages: [
      { id: 'dialog', title: 'Dialog' },
      { id: 'sheet', title: 'Sheet' },
      { id: 'popover', title: 'Popover' },
      { id: 'tooltip', title: 'Tooltip' },
      { id: 'popconfirm', title: 'Popconfirm' },
      { id: 'toast', title: 'Toast' },
    ],
  },
  {
    title: 'Navigation',
    pages: [
      { id: 'tabs', title: 'Tabs' },
      { id: 'breadcrumbs', title: 'Breadcrumbs' },
      { id: 'nav', title: 'Nav' },
      { id: 'anchor', title: 'Anchor' },
      { id: 'pagination', title: 'Pagination' },
      { id: 'steps', title: 'Steps' },
      { id: 'toolbar', title: 'Toolbar' },
      { id: 'ribbon', title: 'Ribbon' },
    ],
  },
  {
    title: 'Layout',
    pages: [
      { id: 'shell', title: 'Shell' },
      { id: 'split', title: 'Split' },
      { id: 'rail', title: 'Rail' },
      { id: 'status-bar', title: 'StatusBar' },
      { id: 'page-header', title: 'PageHeader' },
      { id: 'section', title: 'Section' },
      { id: 'container', title: 'Container' },
      { id: 'flex', title: 'Flex' },
      { id: 'stack', title: 'Stack' },
      { id: 'cluster', title: 'Cluster' },
      { id: 'grid', title: 'Grid' },
      { id: 'columns', title: 'Columns' },
      { id: 'divider', title: 'Divider' },
      { id: 'card', title: 'Card' },
      { id: 'panel', title: 'Panel' },
      { id: 'config-provider', title: 'ConfigProvider' },
    ],
  },
  {
    title: 'Data',
    pages: [
      { id: 'list', title: 'List' },
      { id: 'data-grid', title: 'DataGrid' },
      { id: 'kanban', title: 'Kanban' },
      { id: 'gantt', title: 'Gantt' },
      { id: 'tree', title: 'Tree' },
      { id: 'accordion', title: 'Accordion' },
    ],
  },
  {
    title: 'Display',
    pages: [
      { id: 'icon', title: 'Icon' },
      { id: 'badge', title: 'Badge' },
      { id: 'avatar', title: 'Avatar' },
      { id: 'avatar-group', title: 'AvatarGroup' },
      { id: 'spinner', title: 'Spinner' },
      { id: 'skeleton', title: 'Skeleton' },
      { id: 'progress', title: 'Progress' },
      { id: 'meter', title: 'Meter' },
      { id: 'ring', title: 'Ring' },
      { id: 'banner', title: 'Banner' },
      { id: 'note', title: 'Note' },
      { id: 'result', title: 'Result' },
      { id: 'empty-state', title: 'EmptyState' },
      { id: 'status-dot', title: 'StatusDot' },
      { id: 'caret', title: 'Caret' },
      { id: 'timeline', title: 'Timeline' },
      { id: 'key-value-list', title: 'KeyValueList' },
      { id: 'metric', title: 'Metric' },
      { id: 'file-change', title: 'FileChange' },
    ],
  },
  {
    title: 'Content',
    pages: [
      { id: 'prose', title: 'Prose' },
      { id: 'text', title: 'Text' },
      { id: 'link', title: 'Link' },
      { id: 'code-block', title: 'CodeBlock' },
      { id: 'copyable', title: 'Copyable' },
      { id: 'inserts', title: 'Inserts' },
    ],
  },
  {
    title: 'Charts',
    pages: [
      { id: 'sparkline', title: 'Sparkline' },
      { id: 'legend', title: 'Legend' },
      { id: 'share', title: 'Share' },
      { id: 'heatmap', title: 'Heatmap' },
    ],
  },
  {
    title: 'Agent',
    pages: [
      { id: 'run', title: 'Run' },
      { id: 'queue', title: 'Queue' },
      { id: 'history', title: 'History' },
      { id: 'budget', title: 'Budget' },
      { id: 'step', title: 'Step' },
      { id: 'log', title: 'Log' },
      { id: 'diff', title: 'Diff' },
      { id: 'lanes', title: 'Lanes' },
      { id: 'turn', title: 'Turn' },
      { id: 'composer', title: 'Composer' },
      { id: 'thinking', title: 'Thinking' },
      { id: 'approval', title: 'Approval' },
      { id: 'failure', title: 'Failure' },
    ],
  },
]

export const PAGES: DocPage[] = MANIFEST.flatMap((group) => group.pages)
