import {ActionIcon, Menu} from "@mantine/core"
import {IconSortAscendingLetters} from "@tabler/icons-react"

export default function SortMenu() {
  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon size="lg" variant="default">
          <IconSortAscendingLetters size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item>Title</Menu.Item>
        <Menu.Item>Type</Menu.Item>
        <Menu.Item>Modified</Menu.Item>
        <Menu.Item>Created</Menu.Item>
        <Menu.Divider />
        <Menu.Item>A-Z</Menu.Item>
        <Menu.Item>Z-A</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
