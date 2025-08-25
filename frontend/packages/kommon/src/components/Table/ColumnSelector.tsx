// components/ColumnSelector/ColumnSelector.tsx
import {ActionIcon, Checkbox, Popover, ScrollArea, Stack} from "@mantine/core"
import {IconColumns} from "@tabler/icons-react"
import {useState} from "react"
import {ColumnConfig} from "./types"

interface ColumnSelectorArgs<T> {
  columns: ColumnConfig<T>[]
  onColumnsChange: (columns: ColumnConfig<T>[]) => void
  onToggleColumn?: (columnKey: keyof T) => void
}

export default function ColumnSelector<T>({
  columns,
  onColumnsChange,
  onToggleColumn
}: ColumnSelectorArgs<T>) {
  const [opened, setOpened] = useState(false)

  const handleToggle = (columnKey: keyof T) => {
    if (onToggleColumn) {
      onToggleColumn(columnKey)
    } else {
      const newColumns = columns.map(col =>
        col.key === columnKey ? {...col, visible: !col.visible} : col
      )
      onColumnsChange(newColumns)
    }
  }

  return (
    <Popover
      width={180}
      position="bottom-end"
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <ActionIcon variant="light" onClick={() => setOpened(o => !o)}>
          <IconColumns size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <ScrollArea.Autosize mah={300}>
          <Stack gap="xs">
            {columns.map(column => (
              <Checkbox
                key={String(column.key)}
                label={column.label}
                checked={column.visible !== false}
                onChange={() => handleToggle(column.key)}
                size="sm"
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}
