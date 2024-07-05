import {useDispatch, useSelector} from "react-redux"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"

import {
  fetchGroupDetails,
  selectGroupDetails,
  updateGroupDetails
} from "@/slices/groupDetails"

import EditGroupModal from "./EditGroupModal"
import type {GroupDetails, SliceState} from "@/types"

export default function EditButton({groupId}: {groupId?: number}) {
  const dispatch = useDispatch()
  const group = useSelector(selectGroupDetails) as SliceState<GroupDetails>

  const missingGroupDetails = (groupId: number) => {
    if (!group) {
      return true
    }

    if (!group.data) {
      return true
    }

    if (group.data.id != groupId) {
      return true
    }

    return false
  }

  const onClick = () => {
    if (groupId && missingGroupDetails(groupId)) {
      dispatch(fetchGroupDetails(groupId!))
    }

    openModal<any, {groupId: number}>(EditGroupModal, {
      groupId: groupId!
    })
      .then((group: GroupDetails) => {
        dispatch(updateGroupDetails(group))
      })
      .catch(() => {})
  }

  if (!groupId) {
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
