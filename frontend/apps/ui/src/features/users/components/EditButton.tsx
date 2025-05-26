import {useDisclosure} from "@mantine/hooks"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import EditUserModal from "./EditUserModal"
import {useTranslation} from "react-i18next"

export default function EditButton({userId}: {userId?: string}) {
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
      <Button leftSection={<IconEdit />} variant={"default"} onClick={open}>
        {t("common.edit")}
      </Button>
      <EditUserModal
        opened={opened}
        userId={userId}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
