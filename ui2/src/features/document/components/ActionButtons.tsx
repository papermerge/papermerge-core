import {useAppDispatch, useAppSelector} from "@/app/hooks"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import {selectCurrentNodeID, updateActionPanel} from "@/features/ui/uiSlice"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"
import DeletePagesButton from "./DeletePagesButton"
import EditTitleButton from "./EditTitleButton"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import {selectSelectedPages} from "@/features/document/documentVersSlice"
import type {PanelMode} from "@/types"
import DownloadButton from "./DownloadButton/DownloadButton"
import RotateButton from "./RotateButton"
import RotateCCButton from "./RotateCCButton"
import RunOCRButton from "./RunOCRButton"
import ShareButton from "./ShareButton"

export default function ActionButtons() {
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
  const runtimeConfig = useRuntimeConfig()
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))

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
        <EditTitleButton />
        <DownloadButton />
        {!runtimeConfig.ocr__automatic && <RunOCRButton />}
        {currentNodeID && <ShareButton node_ids={[currentNodeID]} />}
        {selectedPages.length > 0 && <RotateButton />}
        {selectedPages.length > 0 && <RotateCCButton />}
        {selectedPages.length > 0 && <DeletePagesButton />}
      </Group>
      <Group>
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
