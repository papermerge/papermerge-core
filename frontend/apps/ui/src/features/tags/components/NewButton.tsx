import NewButton from "@/components/NewButton"
import {useDisclosure} from "@mantine/hooks"
import {useTranslation} from "react-i18next"
import NewTagModal from "./NewTagModal"

export default function NewButtonContainer() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <NewButton
        onClick={open}
        text={t("tags.addNewTag", {defaultValue: "Add"})}
      />
      <NewTagModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
