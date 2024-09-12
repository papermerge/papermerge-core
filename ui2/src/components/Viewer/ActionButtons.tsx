import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import {updateActionPanel} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"
import {useDispatch, useSelector} from "react-redux"
import EditTitleButton from "./EditTitleButton"

import type {RootState} from "@/app/types"
import {selectSelectedPages} from "@/features/documentVers/documentVersSlice"
import type {PanelMode} from "@/types"
import DownloadButton from "./DownloadButton/DownloadButton"
import RotateButton from "./RotateButton"
import RotateCCButton from "./RotateCCButton"

export default function ActionButtons() {
  const {height, width} = useViewportSize()
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  const selectedPages = useSelector((state: RootState) =>
    selectSelectedPages(state, mode)
  )

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
        {selectedPages.length > 0 && <RotateButton />}
        {selectedPages.length > 0 && <RotateCCButton />}
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
