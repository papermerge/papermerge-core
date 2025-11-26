import {Checkbox, MantineStyleProp, Table} from "@mantine/core"
import {IconColumns2} from "@tabler/icons-react"

interface Args {
  withCheckbox: boolean
  isAllSelected: boolean
  isIndeterminate: boolean
  withSecondaryPanelTriggerColumn?: boolean
  onSelectAll?: (checked: boolean) => void
}

export default function LeadColumnHeader({
  withCheckbox,
  isAllSelected,
  isIndeterminate,
  withSecondaryPanelTriggerColumn = true,
  onSelectAll
}: Args) {
  const style: MantineStyleProp = {
    width: 100,
    minWidth: 100,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  }

  if (withCheckbox) {
    return (
      <Table.Th style={style}>
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={event => onSelectAll?.(event.currentTarget.checked)}
          aria-label="Select all rows"
        />

        {withSecondaryPanelTriggerColumn && (
          <IconColumns2 size={14} style={{opacity: 0.5, cursor: "pointer"}} />
        )}
      </Table.Th>
    )
  }

  if (withSecondaryPanelTriggerColumn) {
    return (
      <Table.Th style={style}>
        <IconColumns2 size={14} style={{opacity: 0.5, cursor: "pointer"}} />
      </Table.Th>
    )
  }

  return <></>
}
