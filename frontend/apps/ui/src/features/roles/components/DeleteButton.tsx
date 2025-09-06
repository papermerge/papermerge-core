import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {clearSelection, selectSelectedIds} from "@/features/roles/storage/role"

import {useTranslation} from "react-i18next"
import {RemoveRoleModal, RemoveRolesModal} from "./DeleteModal"

export function DeleteRoleButton({roleId}: {roleId: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/roles/")
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
      <RemoveRoleModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        roleId={roleId}
      />
    </>
  )
}

export function DeleteRolesButton() {
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
      <RemoveRolesModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        roleIds={selectedIds}
      />
    </>
  )
}
