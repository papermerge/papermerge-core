import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditDocumentTypeModal from "./EditDocumentTypeModal"
import {useTranslation} from "react-i18next"

interface Args {
  documentTypeId: string
}

export default function EditButton({documentTypeId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!documentTypeId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        {t("common.edit")}
      </Button>
    )
  }

  return (
    <>
      <Button leftSection={<IconEdit />} variant={"default"} onClick={open}>
        {t("common.edit")}
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
