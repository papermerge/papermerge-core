import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/roles/storage/role"
import {Group} from "@mantine/core"
import ColumnSelectorContainer from "./ColumnSelector"
import {DeleteRolesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

import {usePanelMode} from "@/hooks"

import Search from "./Search"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {selectedRowIDs && selectedRowIDs.length == 1 ? (
          <EditButton roleId={selectedRowIDs[0]} />
        ) : (
          ""
        )}
        {selectedRowIDs && selectedRowIDs.length >= 1 ? (
          <DeleteRolesButton />
        ) : (
          ""
        )}
      </Group>
      <Group>
        <Search />
        <ColumnSelectorContainer />
      </Group>
    </Group>
  )
}
