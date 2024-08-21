import {Menu, Tooltip, ActionIcon} from "@mantine/core"
import {IconDownload} from "@tabler/icons-react"

export default function DownloadButton() {
  return (
    <Menu>
      <Menu.Target>
        <Tooltip label="Download" withArrow>
          <ActionIcon size={"lg"} variant="default">
            <IconDownload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>Version 1</Menu.Item>
        <Menu.Item>Version 2</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
