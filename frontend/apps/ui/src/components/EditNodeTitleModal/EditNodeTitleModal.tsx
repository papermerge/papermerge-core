import {useRenameFolderMutation} from "@/features/nodes/apiSlice"
import type {EditEntityTitle} from "@/types"
import type {I18NEditNodeTitleModal} from "kommon"
import {EditNodeTitleModal} from "kommon"
import {ChangeEvent, useEffect, useRef, useState} from "react"

import {useTranslation} from "react-i18next"

interface Args {
  node: EditEntityTitle
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTitleModalContainer = ({
  node,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const txt = useI18nText()
  const [renameFolder, {isLoading}] = useRenameFolderMutation()
  const ref = useRef<HTMLButtonElement>(null)
  const [title, setTitle] = useState(node.title)
  const [error, setError] = useState("")

  useEffect(() => {
    // handle "enter" keyboard press
    document.addEventListener("keydown", handleKeydown, false)

    return () => {
      document.removeEventListener("keydown", handleKeydown, false)
    }
  }, [])

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value
    setTitle(value)
  }

  const handleKeydown = async (e: KeyboardEvent) => {
    switch (e.code) {
      case "Enter":
        if (ref.current) {
          ref.current.click()
        }
        break
    }
  }

  const onLocalSubmit = async () => {
    const data = {
      title: title,
      id: node.id
    }

    try {
      await renameFolder(data)
      onSubmit()
      reset() // sets error message back to empty string
    } catch (error: any) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    onCancel()
    reset()
  }

  const reset = () => {
    setError("")
  }

  return (
    <EditNodeTitleModal
      inProgress={isLoading}
      onCancel={onLocalCancel}
      onSubmit={onLocalSubmit}
      onTitleChange={handleTitleChanged}
      value={title}
      error={error}
      opened={opened}
      txt={txt}
    />
  )
}

function useI18nText(): I18NEditNodeTitleModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NEditNodeTitleModal>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        editTitle: t("editNodeTitleModal.title"),
        newTitleLabel: t("editNodeTitleModal.newTitleLabel"),
        placeholder: t("editNodeTitleModal.placeholder"),
        cancel: t("common.cancel"),
        submit: t("common.submit")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}

export default EditNodeTitleModalContainer

/****
 *
 *
 *     <Modal title={"Edit Title"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        data-autofocus
        onChange={handleTitleChanged}
        value={title}
        label="New Title"
        placeholder="title"
        mt="md"
      />
      {error && <Error message={error} />}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button ref={ref} disabled={isLoading} onClick={onLocalSubmit}>
            {t("common.submit")}
          </Button>
        </Group>
      </Group>
    </Modal>
 *
 *
 *
 */
