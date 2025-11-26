import type {MantineStyleProp} from "@mantine/core"
import {Checkbox, Table} from "@mantine/core"
import {IconColumns2} from "@tabler/icons-react"

interface LeadColumnBodyArgs<T> {
  rowId: string
  isSelected: boolean
  row: T
  withCheckbox: boolean
  withSecondaryPanelTriggerColumn?: boolean
  onRowClick?: (row: T, otherPanel: boolean) => void
  onRowSelect?: (rowId: string, checked: boolean) => void
}

export default function LeadColumnBody<T>({
  isSelected,
  rowId,
  row,
  withCheckbox,
  withSecondaryPanelTriggerColumn = true,
  onRowClick,
  onRowSelect
}: LeadColumnBodyArgs<T>) {
  const style: MantineStyleProp = {
    width: 100,
    minWidth: 100,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  }
  const iconStyle = {
    opacity: 0.5,
    cursor: "pointer",
    visibility: "hidden" as const
  }

  if (withCheckbox) {
    return (
      <Table.Td style={style}>
        <Checkbox
          checked={isSelected}
          onChange={event => onRowSelect?.(rowId, event.currentTarget.checked)}
          aria-label={`Select row ${rowId}`}
        />

        {withSecondaryPanelTriggerColumn && (
          <IconColumns2
            size={14}
            onClick={() => onRowClick?.(row, true)}
            style={iconStyle}
            className="hover-icon"
          />
        )}
      </Table.Td>
    )
  }

  if (withSecondaryPanelTriggerColumn) {
    return (
      <Table.Td style={style}>
        <IconColumns2
          size={14}
          onClick={() => onRowClick?.(row, true)}
          style={iconStyle}
          className="hover-icon"
        />
      </Table.Td>
    )
  }

  return <></>
}
