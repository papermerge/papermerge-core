import DeleteButton from "@/components/buttons/DeleteButton"
import {useDisclosure} from "@mantine/hooks"
import {useDispatch} from "react-redux"
import {useNavigate} from "react-router-dom"

import {clearSelection, selectSelectedIDs} from "@/features/tags/storage/tag"

import {useAppSelector} from "@/app/hooks"
import {usePanelMode} from "@/hooks"
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
  const mode = usePanelMode()
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useAppSelector(s => selectSelectedIDs(s, mode))

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
