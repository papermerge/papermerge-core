import NewButton from "@/components/NewButton"
import {useDisclosure} from "@mantine/hooks"
import {useTranslation} from "react-i18next"
import NewCustomFieldModal from "./NewCustomFieldModal"

export default function NewButtonContainer() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <NewButton
        onClick={open}
        text={t("customFields.addNewCustomField", {defaultValue: "Add"})}
      />
      <NewCustomFieldModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
