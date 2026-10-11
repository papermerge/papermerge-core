import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectComponentState,
  setPanelCustomState
} from "@/features/ui/panelRegistry"
import {useCallback} from "react"

// the tree is shown in both the commander and the viewer of a panel; its
// settings live on the commander so they carry over between the two
const SETTINGS_COMPONENT = "commander"

export default function useFolderTreeSetting(
  key: string,
  defaultValue: boolean
): [boolean, (value: boolean) => void] {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const value = useAppSelector(
    s => selectComponentState(s, panelId, SETTINGS_COMPONENT)?.custom?.[key]
  )

  const setValue = useCallback(
    (next: boolean) => {
      dispatch(
        setPanelCustomState({
          panelId,
          component: SETTINGS_COMPONENT,
          key,
          value: next
        })
      )
    },
    [dispatch, panelId, key]
  )

  return [typeof value == "boolean" ? value : defaultValue, setValue]
}
