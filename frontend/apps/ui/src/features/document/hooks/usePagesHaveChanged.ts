import {useAppSelector} from "@/app/hooks"
import {makeSelectPagesHaveChanged} from "@/features/document/store/documentVersSlice"
import {UUID} from "@/types.d/common"
import {useMemo} from "react"

export default function usePagesHaveChanged(docVerID?: UUID) {
  const selectPagesHaveChanged = useMemo(
    () => makeSelectPagesHaveChanged(docVerID),
    [docVerID]
  )
  return useAppSelector(selectPagesHaveChanged) || []
}
