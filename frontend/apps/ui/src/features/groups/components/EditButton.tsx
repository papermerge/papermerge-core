import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditGroupModal from "./EditGroupModal"
import {useTranslation} from "react-i18next"

interface Args {
  groupId: string
}

export default function EditButton({groupId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!groupId) {
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
      <EditGroupModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        groupId={groupId}
      />
    </>
  )
}
