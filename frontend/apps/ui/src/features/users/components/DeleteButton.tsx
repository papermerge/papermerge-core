import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
import {closeUserDetailsSecondaryPanel} from "@/features/users/storage/thunks"
import {useDisclosure} from "@mantine/hooks"
import {useNavigate} from "react-router-dom"

import DeleteButton from "@/components/buttons/DeleteButton"
import {useTranslation} from "react-i18next"
import {RemoveUserModal, RemoveUsersModal} from "./DeleteModal"

export function DeleteUserButton({userId}: {userId: string}) {
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/users/")
    if (panelId == "secondary") {
      dispatch(closeUserDetailsSecondaryPanel())
    }
  }

  return (
    <>
      <DeleteButton
        onClick={open}
        text={t("common.delete", {defaultValue: "Delete"})}
      />
      <RemoveUserModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        userId={userId}
      />
    </>
  )
}

/* Deletes one or multiple users (with confirmation) */
export function DeleteUsersButton() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useAppDispatch()
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
      <RemoveUsersModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        userIds={selectedIds}
      />
    </>
  )
}
