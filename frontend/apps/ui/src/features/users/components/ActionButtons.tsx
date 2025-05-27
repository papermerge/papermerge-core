import {useSelector} from "react-redux"
import {Group} from "@mantine/core"
import {selectSelectedIds} from "@/features/users/usersSlice"

import NewButton from "./NewButton"
import ChangePasswordButton from "./ChangePasswordButton"
import {DeleteUsersButton} from "./DeleteButton"
import EditButton from "./EditButton"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? (
        <ChangePasswordButton userId={selectedIds[0]} />
      ) : (
        ""
      )}
      {selectedIds.length == 1 ? <EditButton userId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteUsersButton /> : ""}
    </Group>
  )
}
