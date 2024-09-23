import {updateSearchActionPanel} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useEffect, useRef} from "react"
import {useDispatch} from "react-redux"

import GoBackButton from "./GoBackButton"
import OpenInOtherPanelCheckbox from "./OpenInOtherPanelCheckbox"

export default function ActionButtons() {
  const {height, width} = useViewportSize()
  const dispatch = useDispatch()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.marginBottom)
      value += parseInt(styles.paddingBottom)
      value += parseInt(styles.paddingTop)
      value += parseInt(styles.height)
      dispatch(updateSearchActionPanel(value))
    }
  }, [width, height])

  return (
    <Group ref={ref} justify="space-between">
      <Group>
        <GoBackButton />
        <OpenInOtherPanelCheckbox />
      </Group>
      {/*
      <Group>
        <ToggleSecondaryPanel />
      </Group>
      */}
    </Group>
  )
}
