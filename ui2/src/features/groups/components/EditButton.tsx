import {useDispatch, useSelector} from "react-redux"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"

import {useGetGroupQuery} from "@/features/api/slice"

import EditGroupModal from "./EditGroupModal"
import type {GroupDetails} from "@/types"

interface Args {
  groupId: string
}

export default function EditButton({groupId}: Args) {
  const dispatch = useDispatch()
  const {data, isLoading} = useGetGroupQuery(groupId)

  const missingGroupDetails = (groupId: string) => {
    if (!data) {
      return true
    }

    if (data.id != groupId) {
      return true
    }

    return false
  }

  const onClick = () => {
    // if (groupId && missingGroupDetails(data)) {
    //dispatch(fetchGroupDetails(groupId!))
    //}

    openModal<any, {groupId: string}>(EditGroupModal, {
      groupId: groupId!
    })
      .then((group: GroupDetails) => {
        //dispatch(updateGroupDetails(group))
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
