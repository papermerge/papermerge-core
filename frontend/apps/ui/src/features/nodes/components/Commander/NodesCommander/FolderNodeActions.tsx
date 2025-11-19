import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectOneSelectedSharedNode,
  selectSelectedNodeIds,
  selectSelectedNodesCount
} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useContext, useRef, useState} from "react"

import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import ManageAccessButton from "@/components/ManageAccessButton"
import QuickFilter from "@/components/QuickFilter"
import SharedButton from "@/components/ShareButton"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"
import DeleteButton from "./DeleteButton"
import EditNodeTagsButton from "./EditNodeTagsButton"
import EditNodeTitleButton from "./EditNodeTitleButton"
import NewFolderButton from "./NewFolderButton"
import SortMenu from "./SortMenu"

export default function FolderNodeActions() {
  const [filterText, selectFilterText] = useState<string>()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedCount = useAppSelector(s => selectSelectedNodesCount(s, mode))
  const selectedNodeIds = useAppSelector(s =>
    selectSelectedNodeIds(s, mode)
  ) as string[]
  const oneSelectedSharedNode = useAppSelector(s =>
    selectOneSelectedSharedNode(s, mode)
  )

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
        {selectedCount == 1 && <EditNodeTitleButton />}
        {selectedCount == 1 && <EditNodeTagsButton />}
        {selectedCount > 0 && <SharedButton node_ids={selectedNodeIds} />}
        {oneSelectedSharedNode && (
          <ManageAccessButton node_id={oneSelectedSharedNode.id} />
        )}
        {selectedCount > 0 && <DeleteButton />}
      </Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        <ViewOptionsMenu />
        <SortMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
