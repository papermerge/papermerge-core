import {useAppSelector} from "@/app/hooks"
import {selectSelectedIDs} from "@/features/users/storage/user"
import {Group} from "@mantine/core"

import {usePanelMode} from "@/hooks"
import ChangePasswordButton from "./ChangePasswordButton"
import ColumnSelector from "./ColumnSelector"
import {DeleteUsersButton} from "./DeleteButton"
import EditButton from "./EditButton"
import NewButton from "./NewButton"

export default function ActionButtons() {
  const mode = usePanelMode()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []

  return (
    <Group justify="space-between" w={"100%"}>
      <Group>
        <NewButton />
        {selectedIds?.length == 1 ? (
          <ChangePasswordButton userId={selectedIds[0]} />
        ) : (
          ""
        )}
        {selectedIds?.length == 1 ? <EditButton userId={selectedIds[0]} /> : ""}
        {selectedIds.length >= 1 ? <DeleteUsersButton /> : ""}
      </Group>
      <Group>
        <ColumnSelector />
      </Group>
    </Group>
  )
}
