import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIds
} from "@/features/custom-fields/customFieldsSlice"

import {RemoveCustomFieldModal, RemoveCustomFieldsModal} from "./DeleteModal"
import {useTranslation} from "react-i18next"

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
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
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
      <RemoveCustomFieldsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        customFieldIds={selectedIds}
      />
    </>
  )
}
