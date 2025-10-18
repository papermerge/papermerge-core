import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"

import ChangePasswordButton from "./ChangePasswordButton"
import ColumnSelector from "./ColumnSelector"
import {DeleteUsersButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"
import {useAuth} from "@/app/hooks/useAuth"
import {USER_CREATE, USER_DELETE, USER_UPDATE} from "@/scopes"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()
  const selectedIds =
    useAppSelector(s => selectPanelSelectedIDs(s, panelId)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        {hasPermission(USER_CREATE) && <NewButton />}
        {hasPermission(USER_UPDATE) && hasOneSelected && (
          <ChangePasswordButton userId={selectedIds[0]} />
        )}
        {hasPermission(USER_UPDATE) && hasOneSelected && (
          <EditButton userId={selectedIds[0]} />
        )}
        {hasPermission(USER_DELETE) && hasAnySelected && <DeleteUsersButton />}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
