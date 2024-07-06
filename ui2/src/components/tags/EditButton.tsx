import {useDispatch, useSelector} from "react-redux"
import {Button} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"

import {
  fetchTagDetails,
  selectTagDetails,
  updateTagDetails
} from "@/slices/tagDetails"

import EditTagModal from "./EditTagModal"
import type {ColoredTagType, SliceState} from "@/types"

export default function EditButton({tagId}: {tagId?: string}) {
  const dispatch = useDispatch()
  const tag = useSelector(selectTagDetails) as SliceState<ColoredTagType>

  const missingTagDetails = (tagId: string) => {
    if (!tag) {
      return true
    }

    if (!tag.data) {
      return true
    }

    if (tag.data.id != tagId) {
      return true
    }

    return false
  }

  const onClick = () => {
    if (tagId && missingTagDetails(tagId)) {
      dispatch(fetchTagDetails(tagId!))
    }

    openModal<any, {tagId: string}>(EditTagModal, {
      tagId: tagId!
    })
      .then((tag: ColoredTagType) => {
        dispatch(updateTagDetails(tag))
      })
      .catch(() => {})
  }

  if (!tagId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        Edit
      </Button>
    )
  }

  return (
    <Button leftSection={<IconEdit />} variant={"default"} onClick={onClick}>
      Edit
    </Button>
  )
}
