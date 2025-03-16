import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconPlus} from "@tabler/icons-react"
import NewRoleModal from "./NewRoleModal"

export default function NewButton() {
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open} variant="default">
        New
      </Button>
      <NewRoleModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
