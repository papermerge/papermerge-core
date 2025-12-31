import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"
import DeleteItemsButton from "./DeleteButton"
import NewButton from "./NewButton"

import {useAuth} from "@/app/hooks/useAuth"
import {API_TOKEN_CREATE, API_TOKEN_DELETE} from "@/scopes"

interface Args {
  onNewToken: () => void
}

export default function ActionButtons({onNewToken}: Args) {
  const {panelId} = usePanel()
  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const {hasPermission} = useAuth()
  const showNewButton = hasPermission(API_TOKEN_CREATE)
  const showDeleteButton =
    hasPermission(API_TOKEN_DELETE) &&
    selectedRowIDs &&
    selectedRowIDs.length >= 1

  return (
    <Group>
      {showNewButton && <NewButton onClick={onNewToken} />}
      {showDeleteButton && <DeleteItemsButton />}
    </Group>
  )
}
