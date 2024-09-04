import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditTagModal from "./EditTagModal"

export default function EditButton({tagId}: {tagId?: string}) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!tagId) {
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
      <EditTagModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        tagId={tagId}
      />
    </>
  )
}
