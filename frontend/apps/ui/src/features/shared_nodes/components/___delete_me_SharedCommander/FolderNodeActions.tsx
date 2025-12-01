import {Group} from "@mantine/core"
import {useState} from "react"

import QuickFilter from "@/components/QuickFilter"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"

export default function FolderNodeActions() {
  const [filterText, selectFilterText] = useState<string>()

  const onQuickFilterClear = () => {
    selectFilterText(undefined)
    //dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onQuickFilterChange = (value: string) => {
    selectFilterText(value)
    //dispatch(filterUpdated({mode, filter: value}))
  }

  return (
    <Group justify="space-between">
      <Group></Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        <ViewOptionsMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
      </Group>
    </Group>
  )
}
