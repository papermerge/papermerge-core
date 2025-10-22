import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"

import ColumnSelector from "./ColumnSelector"
import {DeleteTagsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"
import {useAuth} from "@/app/hooks/useAuth"
import {TAG_CREATE, TAG_DELETE, TAG_UPDATE} from "@/scopes"

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
        {hasPermission(TAG_CREATE) && <NewButton />}
        {hasPermission(TAG_UPDATE) && hasOneSelected && (
          <EditButton tagId={selectedIds[0]} />
        )}
        {hasPermission(TAG_DELETE) && hasAnySelected && <DeleteTagsButton />}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
