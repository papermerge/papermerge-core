import {useDispatch} from "react-redux"
import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import {updateGroupDetails} from "@/slices/groupDetails"
import NewGroupModal from "./NewGroupModal"
import type {GroupDetails} from "@/types"

export default function NewButton() {
  const dispatch = useDispatch()

  const onClick = () => {
    openModal<any, {groupId: number}>(NewGroupModal)
      .then((group: GroupDetails) => {
        dispatch(updateGroupDetails(group))
      })
      .catch(() => {})
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
