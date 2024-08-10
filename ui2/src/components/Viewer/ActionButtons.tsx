import {useContext, useRef, useEffect} from "react"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import {updateActionPanel} from "@/slices/sizes"
import PanelContext from "@/contexts/PanelContext"
import EditTitleButton from "./EditTitleButton"

import type {PanelMode} from "@/types"

export default function ActionButtons() {
  const {height, width} = useViewportSize()
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)

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
      </Group>
      <Group>
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
