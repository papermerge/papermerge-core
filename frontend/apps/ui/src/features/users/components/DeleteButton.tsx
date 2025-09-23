import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {closeUserDetailsSecondaryPanel} from "@/features/users/storage/thunks"
import {useDisclosure} from "@mantine/hooks"
import {useNavigate} from "react-router-dom"

import {clearSelection, selectSelectedIDs} from "@/features/users/storage/user"

import DeleteButton from "@/components/buttons/DeleteButton"
import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import {RemoveUserModal, RemoveUsersModal} from "./DeleteModal"

export function DeleteUserButton({userId}: {userId: string}) {
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/users/")
    if (mode == "secondary") {
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
  const mode = usePanelMode()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useAppDispatch()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode)) || []

  const onSubmit = () => {
    close()
    dispatch(clearSelection({mode}))
  }

  const onCancel = () => {
    close()
    dispatch(clearSelection({mode}))
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
