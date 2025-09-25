import EditButton from "@/components/buttons/EditButton"
import {useDisclosure} from "@mantine/hooks"

import {useTranslation} from "react-i18next"
import EditCustomFieldModal from "./EditCustomFieldModal"

interface Args {
  customFieldId: string
}

export default function EditButtonContainer({customFieldId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!customFieldId) {
    return <EditButton disabled={true} text={t("common.edit")} />
  }

  return (
    <>
      <EditButton onClick={open} text={t("common.edit")} />
      <EditCustomFieldModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        customFieldId={customFieldId}
      />
    </>
  )
}
