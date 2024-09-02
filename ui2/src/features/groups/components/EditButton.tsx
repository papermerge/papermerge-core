import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditGroupModal from "./EditGroupModal"

interface Args {
  groupId: string
}

export default function EditButton({groupId}: Args) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!groupId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        Edit
      </Button>
    )
  }

  return (
    <>
      <Button leftSection={<IconEdit />} variant={"default"} onClick={open}>
        Edit
      </Button>
      <EditGroupModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        groupId={groupId}
      />
    </>
  )
}
