import DeleteButton from "@/components/buttons/DeleteButton"
import {useDisclosure} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"

import {useAppSelector} from "@/app/hooks"

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
    navigate("/categories/")
    close()
  }

  return (
    <>
      <DeleteButton onClick={open} text={t("common.delete")} />
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
  const {panelId} = usePanel()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds =
    useAppSelector(s => selectPanelSelectedIDs(s, panelId)) || []

  const onSubmit = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  const onCancel = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  return (
    <>
      <DeleteButton onClick={open} text={t("common.delete")} />
      <RemoveDocumentTypesModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        documentTypeIds={selectedIds}
      />
    </>
  )
}
