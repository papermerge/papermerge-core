import {useDispatch} from "react-redux"
import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import {updateUserDetails} from "@/slices/userDetails"
import {fetchGroups} from "@/slices/groups"
import NewUserModal from "./NewUserModal"
import type {UserDetails} from "@/types"

export default function NewButton() {
  const dispatch = useDispatch()

  const onClick = () => {
    dispatch(fetchGroups({pageNumber: 1, pageSize: 999}))

    openModal<any, {userId: string}>(NewUserModal)
      .then((user: UserDetails) => {
        dispatch(updateUserDetails(user))
      })
      .catch(() => {})
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
