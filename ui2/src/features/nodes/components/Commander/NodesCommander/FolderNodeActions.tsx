import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectSelectedNodesCount,
  updateActionPanel
} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef, useState} from "react"

import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import QuickFilter from "@/components/QuickFilter"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"
import DeleteButton from "./DeleteButton"
import EditNodeTagsButton from "./EditNodeTagsButton"
import EditNodeTitleButton from "./EditNodeTitleButton"
import NewFolderButton from "./NewFolderButton"
import SortMenu from "./SortMenu"
import UploadButton from "./UploadButton"

export default function FolderNodeActions() {
  const [filterText, selectFilterText] = useState<string>()
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedCount = useAppSelector(s => selectSelectedNodesCount(s, mode))

  const onQuickFilterClear = () => {
    selectFilterText(undefined)
    dispatch(filterUpdated({mode, filter: undefined}))
  }

  const onQuickFilterChange = (value: string) => {
    selectFilterText(value)
    dispatch(filterUpdated({mode, filter: value}))
  }

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.marginBottom)
      value += parseInt(styles.paddingBottom)
      value += parseInt(styles.paddingTop)
      value += parseInt(styles.height)
      dispatch(updateActionPanel({mode, value}))
    }
  }, [width, height])

  return (
    <Group ref={ref} justify="space-between">
      <Group>
        {selectedCount == 0 && <UploadButton />}
        {selectedCount == 0 && <NewFolderButton />}
        {selectedCount == 1 && <EditNodeTitleButton />}
        {selectedCount == 1 && <EditNodeTagsButton />}
        {selectedCount > 0 && <DeleteButton />}
      </Group>
      <Group>
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
