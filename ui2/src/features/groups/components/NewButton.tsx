import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"

import NewGroupModal from "./NewGroupModal"

export default function NewButton() {
  const onClick = () => {
    openModal<any, {groupId: number}>(NewGroupModal)
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
