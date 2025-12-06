import {Box, Loader, Tooltip} from "@mantine/core"
import {IconCheck, IconExclamationCircle} from "@tabler/icons-react"
import type {SaveStatus} from "./types"

interface SaveStatusIndicatorProps {
  status: SaveStatus
  error?: string | null
}

/**
 * Small indicator showing the save status of a field
 *
 * States:
 * - idle: hidden
 * - saving: spinner
 * - saved: green checkmark (fades after 2s via hook)
 * - error: red exclamation with tooltip
 */
export function SaveStatusIndicator({status, error}: SaveStatusIndicatorProps) {
  // Always render a fixed-width container to prevent layout shift
  return (
    <Box
      w={20}
      h={20}
      style={{display: "flex", alignItems: "center", justifyContent: "center"}}
    >
      {status === "saving" && <Loader size={14} />}
      {status === "saved" && (
        <IconCheck size={16} color="var(--mantine-color-green-6)" />
      )}
      {status === "error" && (
        <Tooltip label={error || "Save failed"} withArrow>
          <IconExclamationCircle
            size={16}
            color="var(--mantine-color-red-6)"
            style={{cursor: "help"}}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export default SaveStatusIndicator
