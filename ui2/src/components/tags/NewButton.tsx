import {useDispatch} from "react-redux"
import {Button} from "@mantine/core"

import {IconPlus} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import {updateTagDetails} from "@/slices/tagDetails"
import NewTagModal from "./NewTagModal"
import type {ColoredTagType} from "@/types"

export default function NewButton() {
  const dispatch = useDispatch()

  const onClick = () => {
    openModal<any, {groupId: number}>(NewTagModal)
      .then((tag: ColoredTagType) => {
        dispatch(updateTagDetails(tag))
      })
      .catch(() => {})
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
