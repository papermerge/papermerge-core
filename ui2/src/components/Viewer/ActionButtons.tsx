import {useContext, useRef, useEffect} from "react"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useDispatch, useSelector} from "react-redux"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {updateActionPanel} from "@/slices/sizes"
import PanelContext from "@/contexts/PanelContext"
import EditTitleButton from "./EditTitleButton"

import type {PanelMode} from "@/types"
import type {RootState} from "@/app/types"
import DownloadButton from "./DownloadButton/DownloadButton"
import {selectSelectedPages} from "@/slices/dualPanel/dualPanel"
import RotateCCButton from "./RotateCCButton"
import RotateButton from "./RotateButton"

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
