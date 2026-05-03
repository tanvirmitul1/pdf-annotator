/**
 * Single source of truth for all application shortcuts.
 * This ensures that descriptions, labels, and keys are consistent
 * across the UI (toolbars, help overlay, tooltips).
 */

export interface ShortcutDefinition {
  id?: string
  key: string
  label: string
  category: "Navigation" | "Annotation" | "View" | "Sidebar" | "Search" | "General"
  description: string
  allowInInput?: boolean
}


export const SHORTCUTS: Record<string, Omit<ShortcutDefinition, "id">> = {
  // NAVIGATION
  PREV_PAGE: {
    key: "arrowleft",
    label: "←",
    category: "Navigation",
    description: "Previous page",
  },
  NEXT_PAGE: {
    key: "arrowright",
    label: "→",
    category: "Navigation",
    description: "Next page",
  },

  // VIEW
  ZOOM_IN: {
    key: "+",
    label: "+",
    category: "View",
    description: "Zoom in",
  },
  ZOOM_OUT: {
    key: "-",
    label: "-",
    category: "View",
    description: "Zoom out",
  },
  ZOOM_FIT: {
    key: "0",
    label: "0",
    category: "View",
    description: "Fit width (100%)",
  },

  // SIDEBAR
  TOGGLE_THUMBNAILS: {
    key: "[",
    label: "[",
    category: "Sidebar",
    description: "Toggle thumbnails sidebar",
  },
  TOGGLE_OUTLINE: {
    key: "]",
    label: "]",
    category: "Sidebar",
    description: "Toggle document outline sidebar",
  },

  // SEARCH
  OPEN_SEARCH: {
    key: "ctrl+f",
    label: "Ctrl+F",
    category: "Search",
    description: "Search in document",
    allowInInput: false,
  },

  // GENERAL
  ESCAPE: {
    key: "escape",
    label: "Esc",
    category: "General",
    description: "Close overlays / Stop editing",
  },
  SHOW_SHORTCUTS: {
    key: "?",
    label: "?",
    category: "General",
    description: "Show keyboard shortcuts",
  },

  // ANNOTATION TOOLS (Alt+Key Pattern)
  TOOL_SELECT: {
    key: "alt+v",
    label: "Alt+V",
    category: "Annotation",
    description: "Select / Hand tool",
  },
  TOOL_HIGHLIGHT: {
    key: "alt+h",
    label: "Alt+H",
    category: "Annotation",
    description: "Highlight text",
  },
  TOOL_FREEHAND_HIGHLIGHTER: {
    key: "alt+g",
    label: "Alt+G",
    category: "Annotation",
    description: "Freehand highlighter",
  },
  TOOL_UNDERLINE: {
    key: "alt+u",
    label: "Alt+U",
    category: "Annotation",
    description: "Underline text",
  },
  TOOL_STRIKETHROUGH: {
    key: "alt+s",
    label: "Alt+S",
    category: "Annotation",
    description: "Strikethrough text",
  },
  TOOL_SQUIGGLY: {
    key: "alt+q",
    label: "Alt+Q",
    category: "Annotation",
    description: "Squiggly underline",
  },
  TOOL_NOTE: {
    key: "alt+n",
    label: "Alt+N",
    category: "Annotation",
    description: "Sticky note / Comment",
  },
  TOOL_PEN: {
    key: "alt+p",
    label: "Alt+P",
    category: "Annotation",
    description: "Freehand pen",
  },
  TOOL_RECTANGLE: {
    key: "alt+r",
    label: "Alt+R",
    category: "Annotation",
    description: "Rectangle shape",
  },
  TOOL_CIRCLE: {
    key: "alt+c",
    label: "Alt+C",
    category: "Annotation",
    description: "Circle shape",
  },
  TOOL_LINE: {
    key: "alt+l",
    label: "Alt+L",
    category: "Annotation",
    description: "Straight line",
  },
  TOOL_ARROW: {
    key: "alt+a",
    label: "Alt+A",
    category: "Annotation",
    description: "Arrow shape",
  },
  TOOL_TEXTBOX: {
    key: "alt+t",
    label: "Alt+T",
    category: "Annotation",
    description: "Insert text box",
  },
  TOOL_CHECKMARK: {
    key: "alt+k",
    label: "Alt+K",
    category: "Annotation",
    description: "Checkmark stamp",
  },
  TOOL_CROSSMARK: {
    key: "alt+x",
    label: "Alt+X",
    category: "Annotation",
    description: "Cross mark stamp",
  },
  TOOL_SIGNATURE: {
    key: "alt+i",
    label: "Alt+I",
    category: "Annotation",
    description: "Insert signature",
  },
  TOOL_IMAGE: {
    key: "alt+m",
    label: "Alt+M",
    category: "Annotation",
    description: "Insert image",
  },
  TOOL_REDACT: {
    key: "alt+d",
    label: "Alt+D",
    category: "Annotation",
    description: "Redaction tool",
  },
  TOOL_ERASER: {
    key: "alt+e",
    label: "Alt+E",
    category: "Annotation",
    description: "Eraser tool",
  },

  // ACTIONS
  DELETE_SELECTED: {
    key: "delete",
    label: "Del",
    category: "Annotation",
    description: "Delete selected annotation",
  },
  BACKSPACE_SELECTED: {
    key: "backspace",
    label: "⌫",
    category: "Annotation",
    description: "Delete selected annotation",
  },
  UNDO: {
    key: "ctrl+z",
    label: "Ctrl+Z",
    category: "Annotation",
    description: "Undo last action",
  },
  REDO: {
    key: "ctrl+shift+z",
    label: "Ctrl+Shift+Z",
    category: "Annotation",
    description: "Redo last action",
  },
}

/**
 * Helper to get a full ShortcutDefinition by its ID
 */
export function getShortcut(id: keyof typeof SHORTCUTS): ShortcutDefinition {
  return {
    id,
    ...SHORTCUTS[id],
  }
}

/**
 * Helper to get all shortcuts as an array
 */
export function getAllShortcuts(): ShortcutDefinition[] {
  return Object.entries(SHORTCUTS).map(([id, def]) => ({
    id,
    ...def,
  }))
}
