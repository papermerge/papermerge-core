import {useEffect, useState} from "react"
import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  selectSelectedIds,
  selectTagsByIds,
  clearSelection,
  selectTagById
} from "@/slices/tags"

import {openModal} from "@/components/modals/Generic"

import {DeleteTagModal, DeleteTagsModal} from "./DeleteModal"
import {RootState} from "@/app/types"
import {ColoredTagType} from "@/types"

export function DeleteTagButton({tagId}: {tagId: string}) {
  const [redirect, setRedirect] = useState<boolean>(false)
  const navigate = useNavigate()
  const deletedTag = useSelector<RootState>(state =>
    selectTagById(state, tagId)
  )

  useEffect(() => {
    if (redirect && deletedTag == null) {
      // nagivate only after tag was removed from the storage
      navigate("/tags/")
    }
  }, [deletedTag, redirect])

  const onClick = () => {
    openModal<ColoredTagType[], {tagId: string}>(DeleteTagModal, {
      tagId: tagId
    })
      .then(() => {
        setRedirect(true)
      })
      .catch(() => {})
  }

  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}

export function DeleteTagsButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const tags = useSelector<RootState>(state =>
    selectTagsByIds(state, selectedIds)
  ) as Array<ColoredTagType>

  const onClick = () => {
    openModal<ColoredTagType[], {tags: Array<ColoredTagType>}>(
      DeleteTagsModal,
      {
        tags: tags
      }
    )
      .then(() => {
        dispatch(clearSelection())
      })
      .catch(() => dispatch(clearSelection()))
  }
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}
