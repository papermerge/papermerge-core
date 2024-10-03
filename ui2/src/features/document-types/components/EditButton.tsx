import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditDocumentTypeModal from "./EditDocumentTypeModal"

interface Args {
  documentTypeId: string
}

export default function EditButton({documentTypeId}: Args) {
  const [opened, {open, close}] = useDisclosure(false)

  if (!documentTypeId) {
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
      <EditDocumentTypeModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        documentTypeId={documentTypeId}
      />
    </>
  )
}
