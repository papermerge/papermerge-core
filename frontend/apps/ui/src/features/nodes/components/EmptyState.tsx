import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {selectCurrentUser} from "@/slices/currentUser"
import type {User} from "@/types"
import EmptyFolder from "./EmptyFolder"
import EmptyHome from "./EmptyHome"
import EmptyInbox from "./EmptyInbox"

export default function EmptyState() {
  const {panelId} = usePanel()
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
  const user = useAppSelector(selectCurrentUser) as User | null

  if (!user || !currentNodeID) {
    return null
  }

  if (user.home_folder_id === currentNodeID) {
    return <EmptyHome />
  }

  if (user.inbox_folder_id === currentNodeID) {
    return <EmptyInbox />
  }

  return <EmptyFolder />
}
