import NewButton from "@/components/NewButton"
import {useDisclosure} from "@mantine/hooks"
import {useTranslation} from "react-i18next"
import NewRoleModal from "./NewRoleModal"

export default function NewButtonContainer() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <NewButton
        onClick={open}
        text={t("roles.addNewRole", {defaultValue: "Add"})}
      />
      <NewRoleModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
