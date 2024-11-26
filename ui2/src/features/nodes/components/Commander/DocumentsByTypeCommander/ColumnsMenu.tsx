import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  documentsByTypeCommanderColumnVisibilityToggled,
  selectDocumentsByTypeCommanderColumns
} from "@/features/ui/uiSlice"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconList} from "@tabler/icons-react"
import {useContext} from "react"

export default function ColumnsMenu() {
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)
  const columnsOption = useAppSelector(s =>
    selectDocumentsByTypeCommanderColumns(s, mode)
  )

  const onColumnOptionsChanged = (name: string, currentVisibility: boolean) => {
    const newVisibilityState = !currentVisibility
    dispatch(
      documentsByTypeCommanderColumnVisibilityToggled({
        mode,
        name: name,
        visibility: newVisibilityState
      })
    )
  }

  const menuItems = columnsOption.map(co => (
    <Menu.Item
      key={co.name}
      onClick={() => onColumnOptionsChanged(co.name, co.visible)}
      rightSection={co.visible && <IconCheck />}
    >
      {co.name}
    </Menu.Item>
  ))

  return (
    <Menu shadow="md" width={180}>
      <Menu.Target>
        <ActionIcon size="lg" variant="default">
          <IconList size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>{menuItems}</Menu.Dropdown>
    </Menu>
  )
}
