import ErrorMessage from "@/components/ErrorMessage"
import {useChangePasswordMutation} from "@/features/users/storage/api"

import SuccessMessage from "@/components/SuccessMessage"
import {Box, Button, Group, Loader, Modal, PasswordInput} from "@mantine/core"
import {useForm} from "@mantine/form"
import {useTranslation} from "react-i18next"
import {useModalReset, useSuccessHandler} from "./hooks"
import {getErrorMessage} from "./utils"

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

export default function ChangeUserPasswordModal({
  userId,
  onCancel,
  onSubmit,
  opened
}: ChangePasswordModalArgs) {
  const {t} = useTranslation()
  const [changePassword, {isLoading, isSuccess, error, reset}] =
    useChangePasswordMutation()

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

  useModalReset(opened, form, reset)
  useSuccessHandler(isSuccess, () => {
    form.reset()
    reset()
    onSubmit()
  })

  const onLocalSubmit = async ({password}: {password: string}) => {
    try {
      await changePassword({userId, password}).unwrap()
    } catch (err: any) {
      console.error("Password change failed:", err)
    }
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
          {error && <ErrorMessage>{getErrorMessage(t, error)}</ErrorMessage>}
          {isSuccess && (
            <SuccessMessage>
              {t("changePasswordModal.success.passwordChanged", {
                defaultValue: "Password changed successfully!"
              })}
            </SuccessMessage>
          )}
          <Group justify="space-between" mt="md">
            <Button variant="default" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Group>
              {(isLoading || isSuccess) && <Loader size="sm" />}
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
