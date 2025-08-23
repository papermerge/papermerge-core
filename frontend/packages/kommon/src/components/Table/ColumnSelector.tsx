// components/ColumnSelector/ColumnSelector.tsx
import {
  Button,
  Checkbox,
  Divider,
  Group,
  Popover,
  ScrollArea,
  Stack,
  Text
} from "@mantine/core"
import {IconColumns, IconEye, IconEyeOff} from "@tabler/icons-react"
import {useState} from "react"
import {ColumnConfig} from "./types"

interface ColumnSelectorProps<T> {
  columns: ColumnConfig<T>[]
  onColumnsChange: (columns: ColumnConfig<T>[]) => void
  onToggleColumn?: (columnKey: keyof T) => void
}

export default function ColumnSelector<T>({
  columns,
  onColumnsChange,
  onToggleColumn
}: ColumnSelectorProps<T>) {
  const [opened, setOpened] = useState(false)

  const visibleCount = columns.filter(col => col.visible !== false).length
  const totalCount = columns.length

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

  const showAll = () => {
    const newColumns = columns.map(col => ({...col, visible: true}))
    onColumnsChange(newColumns)
  }

  const hideAll = () => {
    const newColumns = columns.map(col => ({...col, visible: false}))
    onColumnsChange(newColumns)
  }

  const resetToDefault = () => {
    const newColumns = columns.map(col => ({
      ...col,
      visible: col.visible !== false // Reset to initial state
    }))
    onColumnsChange(newColumns)
  }

  return (
    <Popover
      width={280}
      position="bottom-end"
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <Button
          variant="light"
          leftSection={<IconColumns size={16} />}
          onClick={() => setOpened(o => !o)}
        >
          Columns ({visibleCount}/{totalCount})
        </Button>
      </Popover.Target>

      <Popover.Dropdown>
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={500}>
            Column Visibility
          </Text>
          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconEye size={14} />}
              onClick={showAll}
            >
              Show All
            </Button>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconEyeOff size={14} />}
              onClick={hideAll}
            >
              Hide All
            </Button>
          </Group>
        </Group>

        <Divider mb="sm" />

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

        {columns.length > 5 && (
          <>
            <Divider mt="sm" mb="sm" />
            <Button
              size="xs"
              variant="subtle"
              fullWidth
              onClick={resetToDefault}
            >
              Reset to Default
            </Button>
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  )
}
