import {useAppSelector} from "@/app/hooks"
import {Group} from "@mantine/core"
import {useRef} from "react"

import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {selectPanelAllCustom} from "@/features/ui/panelRegistry"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import SharedButton from "@/components/ShareButton"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {usePanel} from "@/features/ui/hooks/usePanel"
import type {NodeType, ViewOption} from "@/types"
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
  const ref = useRef<HTMLDivElement>(null)
  const {panelId} = usePanel()
  const {viewOption} = useAppSelector(s => selectPanelAllCustom(s, panelId))
  const viewOptionValue = viewOption as ViewOption
  const showColumnSelector =
    viewOptionValue == "list" || viewOptionValue === undefined
  const showSortMenu = viewOptionValue == "tile"

  const selectedCount = selectedNodes.length

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
        {showSortMenu && <SortMenu />}
        {showColumnSelector && <ColumnSelector />}
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
