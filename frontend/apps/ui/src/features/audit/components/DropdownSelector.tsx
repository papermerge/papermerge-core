import {ActionIcon, Checkbox, Popover, ScrollArea, Stack} from "@mantine/core"
import {IconFilter} from "@tabler/icons-react"
import {useState} from "react"
import type {DropdownConfig} from "../types"

interface FilterSelectorArgs {
  initialItems: DropdownConfig[]
  onChange: (items: DropdownConfig[]) => void
}

export default function DropdownSelector({
  initialItems,
  onChange
}: FilterSelectorArgs) {
  const [opened, setOpened] = useState(false)
  const [items, setItems] = useState<DropdownConfig[]>(initialItems)

  const onLocalChange = (key: DropdownConfig["key"], checked: boolean) => {
    const newItems = items.map(i =>
      i.key === key ? {...i, visible: checked} : i
    )

    setItems(newItems)
    onChange(newItems)
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
          <IconFilter size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <ScrollArea.Autosize mah={300}>
          <Stack gap="xs">
            {items.map(filter => (
              <Checkbox
                key={String(filter.key)}
                label={filter.label}
                checked={filter.visible !== false}
                onChange={e =>
                  onLocalChange(filter.key, e.currentTarget.checked)
                }
                size="sm"
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}
