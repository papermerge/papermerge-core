import EditButton from "@/components/buttons/EditButton"
import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import {useTranslation} from "react-i18next"
import EditDocumentTypeModal from "./EditDocumentTypeModal"

interface Args {
  documentTypeId: string
}

export default function EditButtonContainer({documentTypeId}: Args) {
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
      <EditButton
        text={t("common.edit", {defaultValue: "Edit"})}
        onClick={open}
      />
      <EditDocumentTypeModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        documentTypeId={documentTypeId}
      />
    </>
  )
}
