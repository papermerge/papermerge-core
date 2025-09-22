import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIds
} from "@/features/groups/storage/group"

import {useTranslation} from "react-i18next"
import {RemoveGroupModal, RemoveGroupsModal} from "./DeleteModal"

export function DeleteGroupButton({groupId}: {groupId: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/groups/")
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
      <RemoveGroupModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        groupId={groupId}
      />
    </>
  )
}

export function DeleteGroupsButton() {
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
      <RemoveGroupsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        groupIds={selectedIds}
      />
    </>
  )
}
