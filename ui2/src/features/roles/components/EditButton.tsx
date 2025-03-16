import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditRoleModal from "./EditRoleModal"

interface Args {
  roleId: string
}

export default function EditButton({roleId}: Args) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!roleId) {
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
      <EditRoleModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        roleId={roleId}
      />
    </>
  )
}
