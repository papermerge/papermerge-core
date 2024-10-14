import {useAppDispatch} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import type {ViewOptionColumn} from "@/types"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconListDetails} from "@tabler/icons-react"
import {useContext} from "react"

export default function ViewOptionsMenu() {
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)

  const onViewOptionsChanged = (column: ViewOptionColumn) => {
    //dispatch(commanderSortMenuColumnUpdated({mode, column}))
    console.log(column)
  }

  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon size="lg" variant="default">
          <IconListDetails size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          onClick={() => onViewOptionsChanged("tile")}
          rightSection={<IconCheck />}
        >
          Tiles
        </Menu.Item>
        <Menu.Item onClick={() => onViewOptionsChanged("list")}>List</Menu.Item>
        <Menu.Item onClick={() => onViewOptionsChanged("document-type")}>
          Document Type
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
