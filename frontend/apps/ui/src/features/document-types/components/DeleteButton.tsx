import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIDs
} from "@/features/document-types/storage/documentType"

import {useAppSelector} from "@/app/hooks"
import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import {RemoveDocumentTypeModal, RemoveDocumentTypesModal} from "./DeleteModal"

export function DeleteDocumentTypeButton({
  documentTypeId
}: {
  documentTypeId: string
}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/document-types/")
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
      <RemoveDocumentTypeModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        documentTypeId={documentTypeId}
      />
    </>
  )
}

export function DeleteDocumentTypesButton() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []

  const onSubmit = () => {
    dispatch(clearSelection({mode}))
    close()
  }

  const onCancel = () => {
    dispatch(clearSelection({mode}))
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
      <RemoveDocumentTypesModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        documentTypeIds={selectedIds}
      />
    </>
  )
}
