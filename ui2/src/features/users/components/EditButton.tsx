import {useDisclosure} from "@mantine/hooks"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import EditUserModal from "./EditUserModal"

export default function EditButton({userId}: {userId?: string}) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!userId) {
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
      <EditUserModal
        opened={opened}
        userId={userId}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
