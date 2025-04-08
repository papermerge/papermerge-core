import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditRoleModal from "./EditRoleModal"
import {useTranslation} from "react-i18next"

interface Args {
  roleId: string
}

export default function EditButton({roleId}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!roleId) {
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
      <EditRoleModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        roleId={roleId}
      />
    </>
  )
}
