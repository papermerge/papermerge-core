import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"

import {clearSelection, selectSelectedIDs} from "@/features/roles/storage/role"

import {usePanelMode} from "@/hooks"
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
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))

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
      {selectedRowIDs && (
        <RemoveRolesModal
          opened={opened}
          onSubmit={onSubmit}
          onCancel={onCancel}
          roleIds={selectedRowIDs}
        />
      )}
    </>
  )
}
