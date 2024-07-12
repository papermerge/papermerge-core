import {useState} from "react"
import {store} from "@/app/store"
import {removeTags} from "@/slices/tags"
import GenericModal from "@/components/modals/Generic"
import type {ColoredTagType} from "@/types"

type RemoveUsersModalArgs = {
  tags: ColoredTagType[]
  onOK: (value: ColoredTagType[]) => void
  onCancel: (reason?: any) => void
}

/* Removes multiple tags */
export function DeleteTagsModal({tags, onOK, onCancel}: RemoveUsersModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const names = tags.map(t => t.name).join(",")

  const handleSubmit = async () => {
    store.dispatch(removeTags(tags.map(t => t.id)))
    onOK(tags)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Tags"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete following tags: {names}?</p>
      {errorMessage}
    </GenericModal>
  )
}

type DeleteTagModalArgs = {
  tagId: string
  onOK: (value: string) => void
  onCancel: (reason?: any) => void
}

/* Removes one specific user */
export function DeleteTagModal({tagId, onOK, onCancel}: DeleteTagModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    store.dispatch(removeTags([tagId]))
    onOK(tagId)
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <GenericModal
      modal_title={"Delete Tags"}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submit_button_title="Remove"
      submit_button_color="red"
    >
      <p>Are you sure you want to delete tag?</p>
      {errorMessage}
    </GenericModal>
  )
}
