import {useState} from "react"
import {useDispatch} from "react-redux"

import {useForm} from "@mantine/form"
import {
  MultiSelect,
  Checkbox,
  Group,
  Button,
  Box,
  Modal,
  TextInput
} from "@mantine/core"

import {IconEdit} from "@tabler/icons-react"

import {openModal} from "@/components/modals/Generic"
import {updateUser} from "@/slices/users"
import {UserEditableFields} from "@/types"

export default function EditButton({userId}: {userId?: string}) {
  const onClick = () => {
    openModal<any, {userId: string}>(EditUserModal, {
      userId: userId!
    })
      .then(() => {})
      .catch(() => {})
  }

  if (!userId) {
    return (
      <Button leftSection={<IconEdit />} variant={"default"} disabled={true}>
        Edit
      </Button>
    )
  }

  return (
    <Button leftSection={<IconEdit />} variant={"default"} onClick={onClick}>
      Edit
    </Button>
  )
}

type GenericModalArgs = {
  userId: string
  onOK: () => void
  onCancel: (reason?: any) => void
}

function EditUserModal({userId, onOK, onCancel}: GenericModalArgs) {
  const dispatch = useDispatch()
  const [show, setShow] = useState<boolean>(true)

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: "",
      email: "",
      is_superuser: false,
      is_active: false,
      groups: []
    },
    validate: {}
  })

  const onSubmit = async (userFields: UserEditableFields) => {
    await dispatch(updateUser({id: userId, ...userFields}))
    onOK()
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal
      closeOnClickOutside={false}
      title={"Change Password"}
      opened={show}
      onClose={onClose}
    >
      <Box>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <TextInput
            label="Username"
            placeholder="username"
            key={form.key("username")}
            {...form.getInputProps("username")}
          />
          <TextInput
            mt="sm"
            label="Email"
            placeholder="email"
            key={form.key("email")}
            {...form.getInputProps("email")}
          />
          <Checkbox
            mt="sm"
            label="Is Superuser"
            key={form.key("is_superuser")}
            {...form.getInputProps("is_superuser")}
          />
          <Checkbox
            mt="sm"
            label="Is Active"
            key={form.key("is_active")}
            {...form.getInputProps("is_active")}
          />
          <MultiSelect
            label="Groups"
            placeholder="Pick value"
            data={["React", "Angular", "Vue", "Svelte"]}
          />
          <Group justify="space-between" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </Group>
        </form>
      </Box>
    </Modal>
  )
}
