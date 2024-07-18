import {useContext, useState} from "react"
import {TextInput} from "@mantine/core"
import {useSelector, useDispatch} from "react-redux"
import {IconSearch, IconX} from "@tabler/icons-react"
import {useThrottledCallback} from "@mantine/hooks"

import PanelContext from "@/contexts/PanelContext"
import {
  selectCurrentFolderID,
  selectLastPageSize,
  fetchPaginatedNodes
} from "@/slices/dualPanel/dualPanel"
import type {RootState} from "@/app/types"
import type {PanelMode} from "@/types"

export default function QuickFilter() {
  const [filterText, setFilterText] = useState<string | null>()
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const folderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )
  const throttledSetValue = useThrottledCallback(value => onChange(value), 1500)

  const onClear = () => {
    setFilterText(null)
    dispatch(
      fetchPaginatedNodes({
        nodeId: folderId!,
        panel: mode,
        urlParams: new URLSearchParams(`page_size=${lastPageSize}`)
      })
    )
  }

  const onChange = (value: string) => {
    const trimmedValue = value.trim() || ""

    setFilterText(trimmedValue)
    dispatch(
      fetchPaginatedNodes({
        nodeId: folderId!,
        panel: mode,
        urlParams: new URLSearchParams(
          `page_size=${lastPageSize}&filter=${trimmedValue}`
        )
      })
    )
  }

  return (
    <TextInput
      rightSection={filterText ? <IconX onClick={onClear} /> : <IconSearch />}
      onChange={event => {
        setFilterText(event.currentTarget.value)
        throttledSetValue(event.currentTarget.value)
      }}
      placeholder="Quick search"
      value={filterText || ""}
    />
  )
}
