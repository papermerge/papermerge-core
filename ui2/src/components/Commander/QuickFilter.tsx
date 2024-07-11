import {useContext} from "react"
import {TextInput} from "@mantine/core"
import {useSelector, useDispatch} from "react-redux"
import {IconSearch} from "@tabler/icons-react"
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
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const folderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )
  const lastPageSize = useSelector((state: RootState) =>
    selectLastPageSize(state, mode)
  )
  const throttledSetValue = useThrottledCallback(value => onChange(value), 1500)

  const onChange = (value: string) => {
    if (!value) {
      return
    }

    const trimmedValue = value.trim()

    if (trimmedValue.length > 1) {
      dispatch(
        fetchPaginatedNodes({
          folderId: folderId!,
          panel: mode,
          urlParams: new URLSearchParams(
            `page_size=${lastPageSize}&filter=${trimmedValue}`
          )
        })
      )
    }
  }

  return (
    <TextInput
      rightSection={<IconSearch />}
      onChange={event => throttledSetValue(event.currentTarget.value)}
      placeholder="Quick search"
    />
  )
}
