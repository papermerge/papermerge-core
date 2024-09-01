import {useState} from "react"

import {useForm} from "@mantine/form"
import {PasswordInput, Group, Button, Box, Modal, Loader} from "@mantine/core"
import {IconPassword} from "@tabler/icons-react"
import {openModal} from "@/components/modals/Generic"
import {useChangePasswordMutation} from "@/features/api/slice"

type ChangePasswordButtonArgs = {
  userId?: string
}

export default function ChangePasswordButton({
  userId
}: ChangePasswordButtonArgs) {
  const onClick = () => {
    // onClick hanlder is attached to the button
    // only when userId is defined and non-empty
    openModal<any, {userId: string}>(ChangeUserPasswordModal, {
      userId: userId!
    })
      .then(() => {})
      .catch(() => {})
  }

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
    <Button
      leftSection={<IconPassword />}
      onClick={onClick} // only with userId defined and non-empty
      variant={"default"}
    >
      Change Password
    </Button>
  )
}

type GenericModalArgs = {
  userId: string
  onOK: () => void
  onCancel: (reason?: any) => void
}

function ChangeUserPasswordModal({userId, onCancel}: GenericModalArgs) {
  const [changePassword, {isLoading, isSuccess}] = useChangePasswordMutation()
  const [show, setShow] = useState<boolean>(true)

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

  const onSubmit = async ({password}: {password: string}) => {
    await changePassword({userId, password})
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"Change Password"} opened={show} onClose={onClose}>
      <Box>
        <form onSubmit={form.onSubmit(onSubmit)}>
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
