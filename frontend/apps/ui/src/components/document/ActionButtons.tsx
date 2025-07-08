import {useAppDispatch} from "@/app/hooks"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import {updateActionPanel} from "@/features/ui/uiSlice"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"
import DeletePagesButton from "./DeletePagesButton"
import EditTitleButton from "./EditTitleButton"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import DownloadButton from "@/features/document/components/DownloadButton"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"
import type {DocumentType} from "@/features/document/types"
import RotateButton from "./RotateButton"
import RotateCCButton from "./RotateCCButton"
import RunOCRButton from "./RunOCRButton"

interface Args {
  doc?: DocumentType
  isFetching: boolean
  isError: boolean
}

export default function ActionButtons({doc, isFetching, isError}: Args) {
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode = useContext(PanelContext)
  const {docVer} = useCurrentDocVer()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})
  const runtimeConfig = useRuntimeConfig()

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
        <EditTitleButton doc={doc} isFetching={isFetching} isError={isError} />
        {!runtimeConfig.ocr__automatic && <RunOCRButton />}
        <DownloadButton />
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
