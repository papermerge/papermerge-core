import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconPlus} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import NewRoleModal from "./NewRoleModal"

export default function NewButton() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button
        leftSection={<IconPlus />}
        onClick={open}
        color={"teal"}
        variant="filled"
      >
        {t("roles.create_new_role")}
      </Button>
      <NewRoleModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
