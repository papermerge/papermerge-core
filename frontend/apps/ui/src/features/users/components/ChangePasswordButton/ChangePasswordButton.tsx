import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconPassword} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import ChangeUserPasswordModal from "./Modal"

interface ChangePasswordButtonArgs {
  userId?: string
}

export default function ChangePasswordButton({
  userId
}: ChangePasswordButtonArgs) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!userId) {
    // if userId is not defined, render button as disabled
    // and without onClick handler
    return (
      <Button
        leftSection={<IconPassword />}
        variant={"filled"}
        color={"teal"}
        disabled={true}
      >
        {t("common.change_password")}
      </Button>
    )
  }

  return (
    <>
      <Button
        leftSection={<IconPassword />}
        onClick={open}
        variant={"filled"}
        color={"teal"}
      >
        {t("common.change_password")}
      </Button>
      <ChangeUserPasswordModal
        opened={opened}
        userId={userId}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
