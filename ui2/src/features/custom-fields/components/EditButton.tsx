import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditCustomFieldModal from "./EditCustomFieldModal"
import {useTranslation} from "react-i18next"

interface Args {
  customFieldId: string
}

export default function EditButton({customFieldId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!customFieldId) {
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
      <EditCustomFieldModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        customFieldId={customFieldId}
      />
    </>
  )
}
