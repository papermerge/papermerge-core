import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"

import {Group} from "@mantine/core"

import ColumnSelector from "./ColumnSelector"
import {DeleteCustomFieldsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"
import {useAuth} from "@/app/hooks/useAuth"
import {
  CUSTOM_FIELD_CREATE,
  CUSTOM_FIELD_DELETE,
  CUSTOM_FIELD_UPDATE
} from "@/scopes"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()
  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        {hasPermission(CUSTOM_FIELD_CREATE) && <NewButton />}
        {hasPermission(CUSTOM_FIELD_UPDATE) && hasOneSelected && (
          <EditButton customFieldId={selectedIds[0]} />
        )}
        {hasPermission(CUSTOM_FIELD_DELETE) && hasAnySelected && (
          <DeleteCustomFieldsButton />
        )}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
