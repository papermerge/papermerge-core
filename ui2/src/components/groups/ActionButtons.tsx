import {useSelector} from "react-redux"
import {Group} from "@mantine/core"
import {selectSelectedIds} from "@/slices/groups"
import NewButton from "./NewButton"
import EditButton from "./EditButton"
import {DeleteGroupsButton} from "./DeleteButton"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? <EditButton groupId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteGroupsButton /> : ""}
    </Group>
  )
}
