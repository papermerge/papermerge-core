import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/users/storage/user"
import {Group} from "@mantine/core"

import {usePanelMode} from "@/hooks"
import ColumnSelector from "./ColumnSelector"
import {DeleteGroupsButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []
  const hasOneSelected = selectedIds.length === 1
  const hasAnySelected = selectedIds.length >= 1

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {hasOneSelected && <EditButton groupId={selectedIds[0]} />}
        {hasAnySelected && <DeleteGroupsButton />}
      </Group>
      <Group>
        <ColumnSelector />
      </Group>
    </Group>
  )
}
