import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import {Group} from "@mantine/core"

import ChangePasswordButton from "./ChangePasswordButton"
import ColumnSelector from "./ColumnSelector"
import {DeleteUsersButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"
import Search from "./Search"

export default function ActionButtons() {
  const {panelId} = usePanel()
  const selectedIds =
    useAppSelector(s => selectPanelSelectedIDs(s, panelId)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {hasOneSelected && <ChangePasswordButton userId={selectedIds[0]} />}
        {hasOneSelected && <EditButton userId={selectedIds[0]} />}
        {hasAnySelected && <DeleteUsersButton />}
      </Group>
      <Group>
        <Search />
        <ColumnSelector />
      </Group>
    </Group>
  )
}
