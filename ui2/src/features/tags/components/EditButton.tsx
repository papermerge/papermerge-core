import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import EditTagModal from "./EditTagModal"
import {useTranslation} from "react-i18next"

export default function EditButton({tagId}: {tagId?: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!tagId) {
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
      <EditTagModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        tagId={tagId}
      />
    </>
  )
}
