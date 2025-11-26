import {useAppDispatch} from "@/app/hooks"

import {Group} from "@mantine/core"
import {useContext, useRef, useState} from "react"

import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import QuickFilter from "@/components/QuickFilter"
import SharedButton from "@/components/ShareButton"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"
import type {NodeType} from "@/types"
import ColumnSelector from "./ColumnSelector"
import DeleteButton from "./DeleteButton"
import EditNodeTagsButton from "./EditNodeTagsButton"
import EditNodeTitleButton from "./EditNodeTitleButton"
import NewFolderButton from "./NewFolderButton"
import SortMenu from "./SortMenu"

interface Args {
  selectedNodes: NodeType[]
}

export default function FolderNodeActions({selectedNodes = []}: Args) {
  const [filterText, selectFilterText] = useState<string>()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedCount = selectedNodes.length

  const onQuickFilterClear = () => {
    selectFilterText(undefined)
    dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onQuickFilterChange = (value: string) => {
    selectFilterText(value)
    dispatch(filterUpdated({mode, filter: value}))
  }

  return (
    <Group ref={ref} justify="space-between">
      <Group>
        {selectedCount == 0 && <NewFolderButton />}
        {selectedCount == 1 && (
          <EditNodeTitleButton selectedNodes={selectedNodes} />
        )}
        {selectedCount == 1 && (
          <EditNodeTagsButton selectedNodes={selectedNodes} />
        )}
        {selectedCount > 0 && <SharedButton selectedNodes={selectedNodes} />}

        {selectedCount > 0 && <DeleteButton selectedNodes={selectedNodes} />}
      </Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        <ViewOptionsMenu />
        <SortMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
        <ColumnSelector />
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
