import {useAppDispatch} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {updateActionPanel} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef} from "react"

import DownloadButton from "@/components/document/DownloadButton/DownloadButton"
import type {DocumentType, PanelMode} from "@/types"

interface Args {
  doc?: DocumentType
  isFetching: boolean
  isError: boolean
}

export default function ActionButtons({doc, isFetching, isError}: Args) {
  const {height, width} = useViewportSize()
  const dispatch = useAppDispatch()
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
        <DownloadButton doc={doc} isFetching={isFetching} isError={isError} />
      </Group>
    </Group>
  )
}
