import {useAppSelector} from "@/app/hooks"
import {Group} from "@mantine/core"

import {selectPanelAllCustom} from "@/features/ui/panelRegistry"

import PanelToolbar from "@/components/DualPanel/PanelToolbar"
import Search from "@/components/Search"
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

export default function PanelToolbarContainer({selectedNodes = []}: Args) {
  return (
    <PanelToolbar
      leftActions={<LeftActions selectedNodes={selectedNodes} />}
      rightActions={<RightActions />}
    />
  )
}

function LeftActions({selectedNodes}: Args) {
  const selectedCount = selectedNodes.length

  return (
    <>
      {selectedCount == 0 && <NewFolderButton />}
      {selectedCount == 1 && (
        <EditNodeTitleButton selectedNodes={selectedNodes} />
      )}
      {selectedCount == 1 && (
        <EditNodeTagsButton selectedNodes={selectedNodes} />
      )}
      {selectedCount > 0 && <SharedButton selectedNodes={selectedNodes} />}

      {selectedCount > 0 && <DeleteButton selectedNodes={selectedNodes} />}
    </>
  )
}

function RightActions() {
  const {panelId} = usePanel()
  const {viewOption} = useAppSelector(s => selectPanelAllCustom(s, panelId))
  const viewOptionValue = viewOption as ViewOption
  const showColumnSelector =
    viewOptionValue == "list" || viewOptionValue === undefined
  const showSortMenu = viewOptionValue == "tile"

  return (
    <Group grow preventGrowOverflow={false} wrap="nowrap">
      <ViewOptionsMenu />
      {showSortMenu && <SortMenu />}
      {showColumnSelector && <ColumnSelector />}
      <Search />
    </Group>
  )
}
