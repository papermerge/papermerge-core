import DeleteButton from "@/components/buttons/DeleteButton"
import {useDisclosure} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  clearPanelSelection,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"

import {useTranslation} from "react-i18next"
import {DeleteTagModal, DeleteTagsModal} from "./DeleteModal"

export function DeleteTagButton({tagId}: {tagId: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/tags/")
  }

  return (
    <>
      <DeleteButton onClick={open} text={t("common.delete")} />
      <DeleteTagModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        tagId={tagId}
      />
    </>
  )
}

export function DeleteTagsButton() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useAppSelector(s => selectPanelSelectedIDs(s, panelId))

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
      <DeleteTagsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        tagIds={selectedIds}
      />
    </>
  )
}
