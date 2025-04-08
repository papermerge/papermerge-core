import {useChangePasswordMutation} from "@/features/users/apiSlice"
import {Box, Button, Group, Loader, Modal, PasswordInput} from "@mantine/core"
import {useForm} from "@mantine/form"
import {useDisclosure} from "@mantine/hooks"
import {IconPassword} from "@tabler/icons-react"
import {useEffect} from "react"
import {useTranslation} from "react-i18next"

interface ChangePasswordButtonArgs {
  userId?: string
}

export default function ChangePasswordButton({
  userId
}: ChangePasswordButtonArgs) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)

  if (!userId) {
    // if userId is not defined, render button as disabled
    // and without onClick handler
    return (
      <Button
        leftSection={<IconPassword />}
        variant={"default"}
        disabled={true}
      >
        {t("common.change_password")}
      </Button>
    )
  }

  return (
    <>
      <Button
        leftSection={<IconPassword />}
        onClick={open} // only with userId defined and non-empty
        variant={"default"}
      >
        {t("common.change_password")}
      </Button>
      <ChangeUserPasswordModal
        opened={opened}
        userId={userId}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}

interface ChangePasswordModalArgs {
  opened: boolean
  userId: string
  onSubmit: () => void
  onCancel: () => void
}

type PasswordWithConfirmation = {
  password: string
  confirmPassword: string
}

function ChangeUserPasswordModal({
  userId,
  onCancel,
  onSubmit,
  opened
}: ChangePasswordModalArgs) {
  const {t} = useTranslation()
  const [changePassword, {isLoading, isSuccess}] = useChangePasswordMutation()

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      password: "",
      confirmPassword: ""
    },

    validate: {
      confirmPassword: (value: string, values: PasswordWithConfirmation) =>
        value !== values.password ? "Passwords did not match" : null,
      password: (value: string) =>
        value.length < 1 ? "Password should not be empty" : null
    }
  })

  useEffect(() => {
    form.reset()
  }, [opened])

  const onLocalSubmit = async ({password}: {password: string}) => {
    await changePassword({userId, password})
    onSubmit()
  }
  const onClose = () => {
    onCancel()
  }

  return (
    <Modal
      title={t("common.change_password")}
      opened={opened}
      onClose={onClose}
    >
      <Box>
        <form onSubmit={form.onSubmit(onLocalSubmit)}>
          <PasswordInput
            label={t("users.form.password")}
            placeholder={t("users.form.password")}
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <PasswordInput
            mt="sm"
            label={t("users.form.confirm_password")}
            placeholder={t("users.form.confirm_password")}
            key={form.key("confirmPassword")}
            {...form.getInputProps("confirmPassword")}
          />
          <Group justify="space-between" mt="md">
            <Button variant="default" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Group>
              {isLoading && <Loader size="sm" />}
              <Button disabled={isLoading || isSuccess} type="submit">
                {t("common.submit")}
              </Button>
            </Group>
          </Group>
        </form>
      </Box>
    </Modal>
  )
}
