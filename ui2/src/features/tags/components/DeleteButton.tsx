import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {selectSelectedIds, clearSelection} from "@/features/tags/tagsSlice"

import {DeleteTagModal, DeleteTagsModal} from "./DeleteModal"
import {useTranslation} from "react-i18next"

export function DeleteTagButton({tagId}: {tagId: string}) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/tags/")
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        {t("common.delete")}
      </Button>
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
      <DeleteTagsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        tagIds={selectedIds}
      />
    </>
  )
}
