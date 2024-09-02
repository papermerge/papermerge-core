import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import {useDisclosure} from "@mantine/hooks"
import NewGroupModal from "./NewGroupModal"

export default function NewButton() {
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open} variant="default">
        New
      </Button>
      <NewGroupModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
