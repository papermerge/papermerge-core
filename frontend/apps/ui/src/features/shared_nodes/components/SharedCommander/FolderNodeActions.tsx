import {useAppDispatch} from "@/app/hooks"
import {Group} from "@mantine/core"
import {useContext, useState} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import QuickFilter from "@/components/QuickFilter"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"

import SortMenu from "./SortMenu"

export default function FolderNodeActions() {
  const [filterText, selectFilterText] = useState<string>()

  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)

  const onQuickFilterClear = () => {
    selectFilterText(undefined)
    dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onQuickFilterChange = (value: string) => {
    selectFilterText(value)
    dispatch(filterUpdated({mode, filter: value}))
  }

  return (
    <Group justify="space-between">
      <Group></Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        <ViewOptionsMenu />
        <SortMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
      </Group>
    </Group>
  )
}
