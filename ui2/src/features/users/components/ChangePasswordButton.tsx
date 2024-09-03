import {useEffect} from "react"
import {useDisclosure} from "@mantine/hooks"
import {useForm} from "@mantine/form"
import {PasswordInput, Group, Button, Box, Modal, Loader} from "@mantine/core"
import {IconPassword} from "@tabler/icons-react"
import {useChangePasswordMutation} from "@/features/users/apiSlice"

interface ChangePasswordButtonArgs {
  userId?: string
}

export default function ChangePasswordButton({
  userId
}: ChangePasswordButtonArgs) {
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
        Change Password
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
        Change Password
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

function ChangeUserPasswordModal({
  userId,
  onCancel,
  onSubmit,
  opened
}: ChangePasswordModalArgs) {
  const [changePassword, {isLoading, isSuccess}] = useChangePasswordMutation()

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      password: "",
      confirmPassword: ""
    },

    validate: {
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords did not match" : null,
      password: value =>
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
    <Modal title={"Change Password"} opened={opened} onClose={onClose}>
      <Box>
        <form onSubmit={form.onSubmit(onLocalSubmit)}>
          <PasswordInput
            label="Password"
            placeholder="Password"
            key={form.key("password")}
            {...form.getInputProps("password")}
          />
          <PasswordInput
            mt="sm"
            label="Confirm password"
            placeholder="Confirm password"
            key={form.key("confirmPassword")}
            {...form.getInputProps("confirmPassword")}
          />
          <Group justify="space-between" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Group>
              {isLoading && <Loader size="sm" />}
              <Button disabled={isLoading || isSuccess} type="submit">
                Submit
              </Button>
            </Group>
          </Group>
        </form>
      </Box>
    </Modal>
  )
}
