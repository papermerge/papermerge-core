import {useAppDispatch} from "@/app/hooks"
import {useDeleteRoleMutation} from "@/features/roles/storage/api"
import {closeRoleDetailsSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanelMode} from "@/hooks"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface RemoveRolesModalArgs {
  roleIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes multiple roles */
export function RemoveRolesModal({
  roleIds,
  opened,
  onSubmit,
  onCancel
}: RemoveRolesModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedRole, {isLoading}] = useDeleteRoleMutation()
  const mode = usePanelMode()
  const dispatch = useAppDispatch()

  const handleSubmit = async () => {
    await Promise.all(roleIds.map(i => deletedRole(i)))
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
      title={t("roles.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("roles.delete.many.description")}</p>
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

interface RemoveRoleModalArgs {
  roleId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes one specific role */
export function RemoveRoleModal({
  roleId,
  onSubmit,
  onCancel,
  opened
}: RemoveRoleModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedRole, {isLoading}] = useDeleteRoleMutation()

  const handleSubmit = async () => {
    await deletedRole(roleId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("roles.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("roles.delete.one.description")}</p>
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
