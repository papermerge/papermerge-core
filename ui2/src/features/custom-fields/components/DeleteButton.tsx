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

export function DeleteCustomFieldButton({
  customFieldId
}: {
  customFieldId: string
}) {
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/custom-fields/")
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        Delete
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
        Delete
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
