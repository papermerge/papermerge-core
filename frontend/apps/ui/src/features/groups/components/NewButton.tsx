import NewButton from "@/components/NewButton"
import {useDisclosure} from "@mantine/hooks"
import {useTranslation} from "react-i18next"
import NewGroupModal from "./NewGroupModal"

export default function NewButtonContainer() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <NewButton
        onClick={open}
        text={t("users.addNewUser", {defaultValue: "Add"})}
      />

      <NewGroupModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
