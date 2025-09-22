import {selectSelectedIds} from "@/features/groups/storage/group"
import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {DeleteGroupsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

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
