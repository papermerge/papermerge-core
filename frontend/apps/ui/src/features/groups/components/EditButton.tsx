import EditButton from "@/components/buttons/EditButton"
import {useDisclosure} from "@mantine/hooks"

import {useTranslation} from "react-i18next"
import EditGroupModal from "./EditGroupModal"

interface Args {
  groupId: string
}

export default function EditButtonContainer({groupId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!groupId) {
    return <EditButton disabled={true} text={t("common.edit")} />
  }

  return (
    <>
      <EditButton onClick={open} text={t("common.edit")} />
      <EditGroupModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        groupId={groupId}
      />
    </>
  )
}
