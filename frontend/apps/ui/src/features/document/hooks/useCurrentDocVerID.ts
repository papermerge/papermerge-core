import {useAppSelector} from "@/app/hooks"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"

export default function useCurrentDocVerID() {
  const mode = usePanelMode()
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))

  return docVerID
}
