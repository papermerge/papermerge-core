import {Group} from "@mantine/core"
import type {ReactNode} from "react"

import DuplicatePanelButton from "./DuplicatePanelButton"
import ToggleSecondaryPanel from "./ToggleSecondaryPanel"

interface PanelToolbarProps {
  /**
   * Left side actions - feature-specific buttons (New, Edit, Delete, etc.)
   */
  leftActions?: ReactNode

  /**
   * Right side actions before panel controls - feature-specific (Search, ColumnSelector, etc.)
   */
  rightActions?: ReactNode

  /**
   * Whether to show panel controls (DuplicatePanelButton, ToggleSecondaryPanel)
   * Default: true
   */
  showPanelControls?: boolean

  /**
   * Full width for the toolbar
   * Default: true
   */
  fullWidth?: boolean
}

/**
 * PanelToolbar - Standardized toolbar for panel components
 *
 * This component provides a consistent layout for panel toolbars:
 * - Left side: Feature-specific action buttons (New, Edit, Delete)
 * - Right side: Feature-specific controls + Panel controls
 *
 * Usage:
 * ```tsx
 * <PanelToolbar
 *   leftActions={
 *     <>
 *       <NewButton />
 *       <EditButton />
 *     </>
 *   }
 *   rightActions={
 *     <>
 *       <Search />
 *       <ColumnSelector />
 *     </>
 *   }
 * />
 * ```
 *
 * The panel controls (DuplicatePanelButton, ToggleSecondaryPanel) are
 * automatically appended to the right side.
 */
export default function PanelToolbar({
  leftActions,
  rightActions,
  showPanelControls = true,
  fullWidth = true
}: PanelToolbarProps) {
  return (
    <Group justify="space-between" w={fullWidth ? "100%" : undefined}>
      <Group>{leftActions}</Group>
      <Group>
        {rightActions}
        {showPanelControls && (
          <>
            <DuplicatePanelButton />
            <ToggleSecondaryPanel />
          </>
        )}
      </Group>
    </Group>
  )
}

/**
 * PanelControls - Standalone panel control buttons
 *
 * Use this when you need just the panel buttons without the full toolbar layout.
 */
export function PanelControls() {
  return (
    <Group gap="xs">
      <DuplicatePanelButton />
      <ToggleSecondaryPanel />
    </Group>
  )
}
