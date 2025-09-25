import {useDisclosure} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIDs
} from "@/features/custom-fields/storage/custom_field"

import {useAppSelector} from "@/app/hooks"
import DeleteButton from "@/components/buttons/DeleteButton"
import {usePanelMode} from "@/hooks"
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
