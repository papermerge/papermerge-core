import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIds
} from "@/features/document-types/documentTypesSlice"

import {RemoveDocumentTypeModal, RemoveDocumentTypesModal} from "./DeleteModal"
import {useTranslation} from "react-i18next"

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
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)

  const onSubmit = () => {
    dispatch(clearSelection())
    close()
  }

  const onCancel = () => {
    dispatch(clearSelection())
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
