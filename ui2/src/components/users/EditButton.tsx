import {useDispatch, useSelector} from "react-redux"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import {fetchGroups} from "@/slices/groups"
import {
  fetchUserDetails,
  selectUserDetails,
  updateUserDetails
} from "@/slices/userDetails"

import EditUserModal from "./EditUserModal"
import type {UserDetails, SliceState} from "@/types"

export default function EditButton({userId}: {userId?: string}) {
  const dispatch = useDispatch()
  const user = useSelector(selectUserDetails) as SliceState<UserDetails>

  const missingUserDetails = (userId: string) => {
    if (!user) {
      return true
    }

    if (!user.data) {
      return true
    }

    if (user.data.id != userId) {
      return true
    }

    return false
  }

  const onClick = () => {
    if (userId && missingUserDetails(userId)) {
      dispatch(fetchUserDetails(userId!))
    }
    dispatch(fetchGroups({pageNumber: 1, pageSize: 999}))

    openModal<any, {userId: string}>(EditUserModal, {
      userId: userId!
    })
      .then((user: UserDetails) => {
        dispatch(updateUserDetails(user))
      })
      .catch(() => {})
  }

  if (!userId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        Edit
      </Button>
    )
  }

  return (
    <Button leftSection={<IconEdit />} variant={"default"} onClick={onClick}>
      Edit
    </Button>
  )
}
