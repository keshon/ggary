/**
 * The demo page's map: categories, the components in each, and a component's
 * variants where it has several. The page is laid out in this order and the
 * navigator is drawn from it, so the two cannot disagree. Every anchor is an
 * element id on both pages.
 */
export interface SiteAnchor {
  id: string
  /** A variant's name; null when the component has one place on the page. */
  label: string | null
}
export interface SiteComponent {
  label: string
  anchors: SiteAnchor[]
}
export interface SiteCategory {
  id: string
  title: string
  components: SiteComponent[]
}

export const SITEMAP: SiteCategory[] = [
  {
    "id": "actions",
    "title": "Actions",
    "components": [
      {
        "label": "Button",
        "anchors": [
          {
            "id": "button-emphasis",
            "label": "Emphasis"
          },
          {
            "id": "button-tone",
            "label": "Destructive, across emphasis"
          },
          {
            "id": "button-sizes",
            "label": "Sizes and states"
          }
        ]
      },
      {
        "label": "Button group",
        "anchors": [
          {
            "id": "button-group",
            "label": null
          }
        ]
      },
      {
        "label": "Chip",
        "anchors": [
          {
            "id": "chip",
            "label": null
          }
        ]
      },
      {
        "label": "ChipGroup",
        "anchors": [
          {
            "id": "chip-group-multi",
            "label": "Multi select, removable"
          },
          {
            "id": "chip-group-single",
            "label": "Single select, vertical"
          }
        ]
      },
      {
        "label": "Menu",
        "anchors": [
          {
            "id": "menu",
            "label": null
          }
        ]
      },
      {
        "label": "Menubar",
        "anchors": [
          {
            "id": "menubar",
            "label": null
          }
        ]
      },
      {
        "label": "Context menu",
        "anchors": [
          {
            "id": "context-menu",
            "label": null
          }
        ]
      },
      {
        "label": "Command palette",
        "anchors": [
          {
            "id": "palette",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "inputs",
    "title": "Inputs",
    "components": [
      {
        "label": "Field and Input",
        "anchors": [
          {
            "id": "field-input",
            "label": "Field and input"
          },
          {
            "id": "input-sizes",
            "label": "Sizes"
          },
          {
            "id": "field-invalid",
            "label": "Invalid, declared by the owner"
          },
          {
            "id": "field-validated",
            "label": "A validated form"
          }
        ]
      },
      {
        "label": "Textarea",
        "anchors": [
          {
            "id": "textarea",
            "label": null
          }
        ]
      },
      {
        "label": "Checkbox",
        "anchors": [
          {
            "id": "checkbox",
            "label": null
          }
        ]
      },
      {
        "label": "Switch",
        "anchors": [
          {
            "id": "switch",
            "label": null
          }
        ]
      },
      {
        "label": "Radio group",
        "anchors": [
          {
            "id": "radio-group",
            "label": null
          }
        ]
      },
      {
        "label": "Fieldset and CheckboxGroup",
        "anchors": [
          {
            "id": "fieldset",
            "label": null
          }
        ]
      },
      {
        "label": "Select",
        "anchors": [
          {
            "id": "select-uncontrolled",
            "label": "Uncontrolled"
          },
          {
            "id": "select-controlled",
            "label": "Controlled"
          }
        ]
      },
      {
        "label": "Combobox",
        "anchors": [
          {
            "id": "combobox",
            "label": null
          }
        ]
      },
      {
        "label": "Cascader",
        "anchors": [
          {
            "id": "cascader",
            "label": null
          }
        ]
      },
      {
        "label": "Date picker and calendar",
        "anchors": [
          {
            "id": "dates",
            "label": null
          }
        ]
      },
      {
        "label": "Time picker",
        "anchors": [
          {
            "id": "times",
            "label": null
          }
        ]
      },
      {
        "label": "Segmented control",
        "anchors": [
          {
            "id": "controls",
            "label": null
          }
        ]
      },
      {
        "label": "Slider",
        "anchors": [
          {
            "id": "slider",
            "label": null
          }
        ]
      },
      {
        "label": "Number field",
        "anchors": [
          {
            "id": "number-field",
            "label": null
          }
        ]
      },
      {
        "label": "Choice cards",
        "anchors": [
          {
            "id": "fields",
            "label": null
          }
        ]
      },
      {
        "label": "Search and affixes",
        "anchors": [
          {
            "id": "search",
            "label": null
          }
        ]
      },
      {
        "label": "File drop",
        "anchors": [
          {
            "id": "file-drop",
            "label": null
          }
        ]
      },
      {
        "label": "Upload",
        "anchors": [
          {
            "id": "upload",
            "label": "Rows"
          },
          {
            "id": "upload-tiles",
            "label": "Tiles"
          }
        ]
      },
      {
        "label": "Form",
        "anchors": [
          {
            "id": "form",
            "label": "Rules, a server and a summary"
          },
          {
            "id": "native-form",
            "label": "Native form participation"
          }
        ]
      },
      {
        "label": "Sizes",
        "anchors": [
          {
            "id": "sizes",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "overlays",
    "title": "Overlays",
    "components": [
      {
        "label": "Dialog",
        "anchors": [
          {
            "id": "dialog",
            "label": null
          }
        ]
      },
      {
        "label": "Popover and Tooltip",
        "anchors": [
          {
            "id": "popover",
            "label": null
          }
        ]
      },
      {
        "label": "Popconfirm",
        "anchors": [
          {
            "id": "popconfirm",
            "label": null
          }
        ]
      },
      {
        "label": "Toast",
        "anchors": [
          {
            "id": "toast",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "navigation-group",
    "title": "Navigation",
    "components": [
      {
        "label": "Tabs",
        "anchors": [
          {
            "id": "tabs",
            "label": null
          }
        ]
      },
      {
        "label": "Breadcrumbs",
        "anchors": [
          {
            "id": "navigation",
            "label": null
          }
        ]
      },
      {
        "label": "Nav",
        "anchors": [
          {
            "id": "nav",
            "label": null
          }
        ]
      },
      {
        "label": "Pagination",
        "anchors": [
          {
            "id": "pagination",
            "label": null
          }
        ]
      },
      {
        "label": "Steps",
        "anchors": [
          {
            "id": "steps",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "layout-group",
    "title": "Layout",
    "components": [
      {
        "label": "Shell and split",
        "anchors": [
          {
            "id": "layout",
            "label": null
          }
        ]
      },
      {
        "label": "Rail",
        "anchors": [
          {
            "id": "rail",
            "label": null
          }
        ]
      },
      {
        "label": "Page header, sections and flow",
        "anchors": [
          {
            "id": "page-header",
            "label": null
          }
        ]
      },
      {
        "label": "Card and Panel",
        "anchors": [
          {
            "id": "regions",
            "label": null
          }
        ]
      },
      {
        "label": "Divider",
        "anchors": [
          {
            "id": "divider",
            "label": null
          }
        ]
      },
      {
        "label": "Flex and Columns",
        "anchors": [
          {
            "id": "flex",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "data",
    "title": "Data",
    "components": [
      {
        "label": "Data grid",
        "anchors": [
          {
            "id": "grid",
            "label": null
          }
        ]
      },
      {
        "label": "Kanban",
        "anchors": [
          {
            "id": "kanban",
            "label": null
          }
        ]
      },
      {
        "label": "Gantt",
        "anchors": [
          {
            "id": "gantt",
            "label": null
          }
        ]
      },
      {
        "label": "Accordion, tree and progress",
        "anchors": [
          {
            "id": "disclosure",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "display-group",
    "title": "Display and feedback",
    "components": [
      {
        "label": "Badge, Avatar, Spinner and Skeleton",
        "anchors": [
          {
            "id": "display",
            "label": null
          }
        ]
      },
      {
        "label": "Banner and Note",
        "anchors": [
          {
            "id": "banners",
            "label": null
          }
        ]
      },
      {
        "label": "Result",
        "anchors": [
          {
            "id": "result",
            "label": null
          }
        ]
      },
      {
        "label": "Metric and readouts",
        "anchors": [
          {
            "id": "readouts",
            "label": null
          }
        ]
      },
      {
        "label": "Code and inserts",
        "anchors": [
          {
            "id": "code",
            "label": null
          }
        ]
      },
      {
        "label": "Prose, Text and Link",
        "anchors": [
          {
            "id": "typography",
            "label": null
          }
        ]
      }
    ]
  },
  {
    "id": "agent-layer",
    "title": "Agent layer",
    "components": [
      {
        "label": "Run, queue, history and budget",
        "anchors": [
          {
            "id": "run-queue",
            "label": null
          }
        ]
      },
      {
        "label": "Step, log, diff and lanes",
        "anchors": [
          {
            "id": "run-stream",
            "label": null
          }
        ]
      },
      {
        "label": "Turn, composer, thinking, approval and failure",
        "anchors": [
          {
            "id": "run-chat",
            "label": null
          }
        ]
      }
    ]
  }
]
