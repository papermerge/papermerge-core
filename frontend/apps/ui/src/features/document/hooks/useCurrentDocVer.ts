import {useAppSelector} from "@/app/hooks"
import {selectCurrentDocVer} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"

export default function useCurrentDocVer() {
  const mode = usePanelMode()
  const docVer = useAppSelector(s => selectCurrentDocVer(s, mode))

  return docVer
}
