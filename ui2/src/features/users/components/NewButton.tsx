import {useDisclosure} from "@mantine/hooks"
import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import NewUserModal from "./NewUserModal"
import {useTranslation} from "react-i18next"

export default function NewButton() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open} variant="default">
        {t("common.new")}
      </Button>
      <NewUserModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
