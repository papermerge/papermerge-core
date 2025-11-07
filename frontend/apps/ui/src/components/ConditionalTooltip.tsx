import {Tooltip, TooltipProps} from "@mantine/core"
import {ReactElement} from "react"

interface Args {
  showTooltipIf: boolean // Whether to show the tooltip wrapper
  children: ReactElement //  The child element to potentially wrap with a tooltip
  tooltipProps: Omit<TooltipProps, "children"> // Mantine Tooltip props to apply when condition is true
}

export const ConditionalTooltip = ({
  showTooltipIf,
  children,
  tooltipProps
}: Args) => {
  if (showTooltipIf) {
    return <Tooltip {...tooltipProps}>{children}</Tooltip>
  }

  return <>{children}</>
}

export default ConditionalTooltip
