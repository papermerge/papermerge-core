import {useAppSelector} from "@/app/hooks"
import {makeSelectSelectedPages} from "@/features/document/store/documentVersSlice"
import {PanelMode} from "@/types"
import {UUID} from "@/types.d/common"
import {useMemo} from "react"

interface Args {
  mode: PanelMode
  docVerID?: UUID
}

export default function useSelectedPages({mode, docVerID}: Args) {
  const selectSelectedPages = useMemo(
    () => makeSelectSelectedPages(mode, docVerID),
    [mode, docVerID]
  )
  const selectedPages = useAppSelector(selectSelectedPages) || []

  return selectedPages
}
