import {useAppDispatch} from "@/app/hooks"
import {useDeleteAPITokenMutation} from "@/features/api-tokens/apiSlice"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanelMode} from "@/hooks"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface RemoveItemsModalArgs {
  ids: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

export default function RemoveItemsModal({
  ids,
  opened,
  onSubmit,
  onCancel
}: RemoveItemsModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteItem, {isLoading}] = useDeleteAPITokenMutation()
  const mode = usePanelMode()
  const dispatch = useAppDispatch()

  const handleSubmit = async () => {
    await Promise.all(ids.map(i => deleteItem(i)))
    onSubmit()
    if (mode == "secondary") {
      dispatch(closeRoleDetailsSecondaryPanel())
    }
  }

  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("api_tokens.delete.title", {
        defaultValue: "Delete API Token(s)"
      })}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        {t("api_tokens.delete.description", {
          defaultValue: "Are you sure you want to delete selected API Tokens?"
        })}

        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={isLoading}
            color={"red"}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
