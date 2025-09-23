import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditButton from "@/components/buttons/EditButton"
import {useTranslation} from "react-i18next"
import EditUserModal from "./EditUserModal"

export default function EditButtonContainer({userId}: {userId?: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!userId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        {t("common.edit")}
      </Button>
    )
  }

  return (
    <>
      <EditButton
        onClick={open}
        text={t("common.edit", {defaultValue: "Edit"})}
      />
      <EditUserModal
        opened={opened}
        userId={userId}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
