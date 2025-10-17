import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
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
      <Button
        leftSection={<IconTrash />}
        onClick={open}
        variant={"filled"}
        color={"red"}
      >
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
  const {panelId} = usePanel()
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
      <Button
        leftSection={<IconTrash />}
        variant={"filled"}
        color={"red"}
        onClick={open}
      >
        {t("common.delete")}
      </Button>
      {selectedRowIDs && selectedRowIDs.length > 0 && (
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
