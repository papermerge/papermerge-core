import type {FilterListConfig} from "@/features/audit/types"
import {ActionIcon, Checkbox, Popover, ScrollArea, Stack} from "@mantine/core"
import {IconFilter} from "@tabler/icons-react"
import {useState} from "react"
import useFilterList from "../hooks/useFilterList"

interface FilterSelectorArgs {
  onChange: (items: FilterListConfig[]) => void
}

export default function DropdownSelector({onChange}: FilterSelectorArgs) {
  const [opened, setOpened] = useState(false)
  const filtersList = useFilterList()

  const checkboxes = filtersList.map(filter => (
    <Checkbox
      key={String(filter.key)}
      label={filter.label}
      checked={filter.visible !== false}
      onChange={e => onLocalChange(filter.key, e.currentTarget.checked)}
      size="sm"
    />
  ))

  const onLocalChange = (key: FilterListConfig["key"], checked: boolean) => {
    const newItems = filtersList.map(i =>
      i.key === key ? {...i, visible: checked} : i
    )

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
          <Stack gap="xs">{checkboxes}</Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}
