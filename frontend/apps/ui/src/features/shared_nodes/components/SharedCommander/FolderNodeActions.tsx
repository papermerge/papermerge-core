import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectSelectedNodesCount,
  updateActionPanel
} from "@/features/ui/uiSlice"
import {Group} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {useContext, useEffect, useRef, useState} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

import QuickFilter from "@/components/QuickFilter"
import ViewOptionsMenu from "@/features/nodes/components/Commander/ViewOptionsMenu"
import {filterUpdated} from "@/features/ui/uiSlice"

import SortMenu from "./SortMenu"

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
      <Group></Group>
      <Group grow preventGrowOverflow={false} wrap="nowrap">
        <ViewOptionsMenu />
        <SortMenu />
        <QuickFilter
          onChange={onQuickFilterChange}
          onClear={onQuickFilterClear}
          filterText={filterText}
        />
      </Group>
    </Group>
  )
}
