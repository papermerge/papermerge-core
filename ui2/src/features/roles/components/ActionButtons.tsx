import {selectSelectedIds} from "@/features/roles/rolesSlice"
import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {DeleteRolesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? <EditButton roleId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteRolesButton /> : ""}
    </Group>
  )
}
