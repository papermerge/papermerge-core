import {selectSelectedIds} from "@/features/roles/storage/role"
import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import ColumnSelectorContainer from "./ColumnSelector"
import {DeleteRolesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {selectedIds.length == 1 ? <EditButton roleId={selectedIds[0]} /> : ""}
        {selectedIds.length >= 1 ? <DeleteRolesButton /> : ""}
      </Group>
      <Group>
        <Search />
        <ColumnSelectorContainer />
      </Group>
    </Group>
  )
}
