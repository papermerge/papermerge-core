import {useContext, useRef, useEffect} from "react"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useSelector, useDispatch} from "react-redux"
import {selectSelectedNodeIds} from "@/slices/dualPanel/dualPanel"
import {updateActionPanel} from "@/features/ui/uiSlice"

import type {RootState} from "@/app/types"
import type {PanelMode} from "@/types"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"

import PanelContext from "@/contexts/PanelContext"

import QuickFilter from "./QuickFilter"
import DeleteButton from "./DeleteButton"
import NewFolderButton from "./NewFolderButton"
import UploadButton from "./UploadButton"
import EditNodeTagsButton from "./EditNodeTagsButton"
import EditNodeTitleButton from "./EditNodeTitleButton"

export default function FolderNodeActions() {
  const {height, width} = useViewportSize()
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  ) as Array<string>

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
        {selectedIds.length == 0 && <UploadButton />}
        {selectedIds.length == 0 && <NewFolderButton />}
        {selectedIds.length == 1 && <EditNodeTitleButton />}
        {selectedIds.length == 1 && <EditNodeTagsButton />}
        {selectedIds.length > 0 && <DeleteButton />}
      </Group>
      <Group>
        <QuickFilter />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
