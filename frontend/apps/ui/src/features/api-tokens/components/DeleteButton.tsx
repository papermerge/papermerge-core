import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
import {useTranslation} from "react-i18next"
import RemoveItemsModal from "./DeleteModal"

export default function DeleteItemsButton() {
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
        <RemoveItemsModal
          opened={opened}
          onSubmit={onSubmit}
          onCancel={onCancel}
          ids={selectedRowIDs}
        />
      )}
    </>
  )
}
