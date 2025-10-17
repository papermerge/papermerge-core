import {useDisclosure} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"

import {useAppSelector} from "@/app/hooks"
import DeleteButton from "@/components/buttons/DeleteButton"

import {useTranslation} from "react-i18next"
import {RemoveCustomFieldModal, RemoveCustomFieldsModal} from "./DeleteModal"

export function DeleteCustomFieldButton({
  customFieldId
}: {
  customFieldId: string
}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/custom-fields/")
    close()
  }

  return (
    <>
      <DeleteButton onClick={open} text={t("common.delete")} />
      <RemoveCustomFieldModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        customFieldId={customFieldId}
      />
    </>
  )
}

export function DeleteCustomFieldsButton() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))

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
      <RemoveCustomFieldsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        customFieldIds={selectedIds}
      />
    </>
  )
}
