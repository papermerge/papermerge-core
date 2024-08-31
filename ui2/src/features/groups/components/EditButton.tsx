import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import EditGroupModal from "./EditGroupModal"

interface Args {
  groupId: string
}

export default function EditButton({groupId}: Args) {
  const onClick = () => {
    openModal<any, {groupId: string}>(EditGroupModal, {
      groupId: groupId!
    })
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
