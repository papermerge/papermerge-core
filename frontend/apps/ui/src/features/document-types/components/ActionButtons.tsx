import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/document-types/storage/documentType"
import {usePanelMode} from "@/hooks"
import {Group} from "@mantine/core"
import {DeleteDocumentTypesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between">
      <Group>
        <NewButton />
        {hasOneSelected && <EditButton documentTypeId={selectedIds[0]} />}
        {hasAnySelected && <DeleteDocumentTypesButton />}
      </Group>
      <Group>will add soon...</Group>
    </Group>
  )
}
