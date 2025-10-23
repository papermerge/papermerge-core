import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"

import ColumnSelector from "./ColumnSelector"
import {DeleteGroupsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"
import {useAuth} from "@/app/hooks/useAuth"
import {GROUP_CREATE, GROUP_DELETE, GROUP_UPDATE} from "@/scopes"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()
  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        {hasPermission(GROUP_CREATE) && <NewButton />}
        {hasPermission(GROUP_UPDATE) && hasOneSelected && (
          <EditButton groupId={selectedIds[0]} />
        )}
        {hasPermission(GROUP_DELETE) && hasAnySelected && (
          <DeleteGroupsButton />
        )}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
