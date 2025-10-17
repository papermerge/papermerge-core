import {usePanel} from "@/features/ui/hooks/usePanel"
import {useDisclosure} from "@mantine/hooks"
import {useNavigate} from "react-router-dom"

import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import DeleteButton from "@/components/buttons/DeleteButton"
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
      <DeleteButton onClick={open} text={t("common.delete")} />
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
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))

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
      <RemoveGroupsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        groupIds={selectedRowIDs}
      />
    </>
  )
}
