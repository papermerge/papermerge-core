import {useAppSelector} from "@/app/hooks"
import type {Coord} from "@/types"
import {Box, Menu, rem} from "@mantine/core"
import {
  IconEdit,
  IconRotate,
  IconRotateClockwise,
  IconTrash,
  IconX
} from "@tabler/icons-react"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
import {selectSelectedPages} from "@/features/document/documentVersSlice"
import type {PanelMode} from "@/types"

interface Args {
  opened: boolean
  onChange: (opened: boolean) => void
  position: Coord
}

export default function ContextMenu({position, opened, onChange}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []

  return (
    <Menu
      position="bottom-start"
      opened={opened}
      onChange={onChange}
      shadow="md"
      width={230}
    >
      <Menu.Target>
        <Box
          style={{
            position: "absolute",
            top: `${position.y}px`,
            left: `${position.x}px`
          }}
        ></Box>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconEdit style={{width: rem(14), height: rem(14)}} />}
        >
          Change title
        </Menu.Item>
        {selectedPages.length > 0 && (
          <Menu.Item
            leftSection={
              <IconRotateClockwise style={{width: rem(14), height: rem(14)}} />
            }
          >
            Rotate clockwise
          </Menu.Item>
        )}
        {selectedPages.length > 0 && (
          <Menu.Item
            leftSection={
              <IconRotate style={{width: rem(14), height: rem(14)}} />
            }
          >
            Rotate counter-clockwise
          </Menu.Item>
        )}
        {selectedPages.length > 0 && (
          <Menu.Item
            color="red"
            leftSection={
              <IconTrash style={{width: rem(14), height: rem(14)}} />
            }
          >
            Delete pages
          </Menu.Item>
        )}

        <Menu.Label>Danger zone</Menu.Label>
        <Menu.Item
          color="red"
          leftSection={<IconX style={{width: rem(14), height: rem(14)}} />}
        >
          Delete Document
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
