import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  clearSelection,
  selectSelectedIDs
} from "@/features/groups/storage/group"

import {useAppSelector} from "@/app/hooks"
import {usePanelMode} from "@/hooks"
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
  const mode = usePanelMode()
  const {t} = useTranslation()
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
      <RemoveGroupsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        groupIds={selectedIds}
      />
    </>
  )
}
