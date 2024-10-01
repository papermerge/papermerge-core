import {Group} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import NewButton from "./NewButton"
import NewCustomFieldModal from "./NewCustomFieldModal"

export default function ActionButtons() {
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <Group>
      <NewButton />
      <NewCustomFieldModal opened={opened} onSubmit={close} onCancel={close} />
    </Group>
  )
}
