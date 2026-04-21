"use client"

import type { ViewerShellProps } from "./viewer-shell"
import { ViewerShell } from "./viewer-shell"

export function ViewerShellLoader(props: ViewerShellProps) {
    return <ViewerShell {...props} />
}
