import {useSelector} from "react-redux"
import {Group} from "@mantine/core"
import {selectSelectedIds} from "@/slices/tags"
import NewButton from "./NewButton"
import EditButton from "./EditButton"
import {DeleteTagsButton} from "./DeleteButton"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? <EditButton tagId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteTagsButton /> : ""}
    </Group>
  )
}
