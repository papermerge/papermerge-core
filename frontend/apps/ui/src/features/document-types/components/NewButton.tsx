import NewButton from "@/components/NewButton"
import {useDisclosure} from "@mantine/hooks"

import {useTranslation} from "react-i18next"
import NewDocumentTypeModal from "./NewDocumentTypeModal"

export default function NewButtonContainer() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <NewButton
        onClick={open}
        text={t("documentTypes.addNewDocumentType", {defaultValue: "Add"})}
      />
      <NewDocumentTypeModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
