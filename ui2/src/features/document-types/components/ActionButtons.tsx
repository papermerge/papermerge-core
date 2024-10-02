import {useAppSelector} from "@/app/hooks"
import {selectSelectedIds} from "@/features/document-types/documentTypesSlice"
import {Group} from "@mantine/core"
import {DeleteDocumentTypesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const selectedIds = useAppSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? (
        <EditButton documentTypeId={selectedIds[0]} />
      ) : (
        ""
      )}
      {selectedIds.length >= 1 ? <DeleteDocumentTypesButton /> : ""}
    </Group>
  )
}
