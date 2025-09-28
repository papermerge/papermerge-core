import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/document-types/storage/documentType"
import {usePanelMode} from "@/hooks"
import {Group} from "@mantine/core"
import ColumnSelector from "./ColumnSelector"
import {DeleteDocumentTypesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {hasOneSelected && <EditButton documentTypeId={selectedIds[0]} />}
        {hasAnySelected && <DeleteDocumentTypesButton />}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
