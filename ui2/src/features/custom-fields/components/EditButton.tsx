import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditCustomFieldModal from "./EditCustomFieldModal"

interface Args {
  customFieldId: string
}

export default function EditButton({customFieldId}: Args) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!customFieldId) {
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
      <EditCustomFieldModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        customFieldId={customFieldId}
      />
    </>
  )
}
