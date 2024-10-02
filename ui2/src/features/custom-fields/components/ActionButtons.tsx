import {useAppSelector} from "@/app/hooks"
import {selectSelectedIds} from "@/features/custom-fields/customFieldsSlice"
import {Group} from "@mantine/core"
import {DeleteCustomFieldsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const selectedIds = useAppSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? (
        <EditButton customFieldId={selectedIds[0]} />
      ) : (
        ""
      )}
      {selectedIds.length >= 1 ? <DeleteCustomFieldsButton /> : ""}
    </Group>
  )
}
