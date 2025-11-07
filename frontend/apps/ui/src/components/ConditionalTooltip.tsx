import {Tooltip, TooltipProps} from "@mantine/core"
import {ReactElement} from "react"

interface ConditionalTooltipProps {
  /**
   * Whether to show the tooltip wrapper
   */
  showTooltipIf: boolean
  /**
   * The child element to potentially wrap with a tooltip
   */
  children: ReactElement
  /**
   * Mantine Tooltip props to apply when condition is true
   */
  tooltipProps: Omit<TooltipProps, "children">
}

export const ConditionalTooltip = ({
  showTooltipIf,
  children,
  tooltipProps
}: ConditionalTooltipProps) => {
  if (showTooltipIf) {
    return <Tooltip {...tooltipProps}>{children}</Tooltip>
  }

  return <>{children}</>
}

export default ConditionalTooltip
