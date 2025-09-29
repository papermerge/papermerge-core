import EditButton from "@/components/buttons/EditButton"
import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"

import {useTranslation} from "react-i18next"
import EditTagModal from "./EditTagModal"

export default function EditButtonContainer({tagId}: {tagId?: string}) {
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
      <EditButton onClick={open} text={t("common.edit")} />
      <EditTagModal
        opened={opened}
        onSubmit={close}
        onCancel={close}
        tagId={tagId}
      />
    </>
  )
}
