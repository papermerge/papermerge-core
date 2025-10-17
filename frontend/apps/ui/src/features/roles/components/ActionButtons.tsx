import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"
import ColumnSelectorContainer from "./ColumnSelector"
import {DeleteRolesButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

import Search from "./Search"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))

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
