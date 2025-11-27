import {useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import Search from "@/components/Search"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {
  DOCUMENT_TYPE_CREATE,
  DOCUMENT_TYPE_DELETE,
  DOCUMENT_TYPE_UPDATE
} from "@/scopes"
import {Group} from "@mantine/core"
import ColumnSelector from "./ColumnSelector"
import {DeleteDocumentTypesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const {hasPermission} = useAuth()

  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        {hasPermission(DOCUMENT_TYPE_CREATE) && <NewButton />}
        {hasPermission(DOCUMENT_TYPE_UPDATE) && hasOneSelected && (
          <EditButton documentTypeId={selectedIds[0]} />
        )}
        {hasPermission(DOCUMENT_TYPE_DELETE) && hasAnySelected && (
          <DeleteDocumentTypesButton />
        )}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
