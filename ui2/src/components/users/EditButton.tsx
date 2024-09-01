import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"

import EditUserModal from "./EditUserModal"

export default function EditButton({userId}: {userId?: string}) {
  const onClick = () => {
    openModal<any, {userId: string}>(EditUserModal, {
      userId: userId!
    })
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
