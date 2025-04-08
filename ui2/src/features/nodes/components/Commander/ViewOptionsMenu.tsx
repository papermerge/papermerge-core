import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  commanderViewOptionUpdated,
  selectCommanderViewOption
} from "@/features/ui/uiSlice"
import type {ViewOption} from "@/types"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconListDetails} from "@tabler/icons-react"
import {useContext} from "react"
import {useTranslation} from "react-i18next"

export default function ViewOptionsMenu() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))

  const onViewOptionsChanged = (value: ViewOption) => {
    dispatch(commanderViewOptionUpdated({mode, viewOption: value}))
  }

  return (
    <Menu shadow="md" width={180}>
      <Menu.Target>
        <ActionIcon size="lg" variant="default">
          <IconListDetails size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          onClick={() => onViewOptionsChanged("tile")}
          rightSection={viewOption == "tile" && <IconCheck />}
        >
          {t("common.sort.tiles")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onViewOptionsChanged("list")}
          rightSection={viewOption == "list" && <IconCheck />}
        >
          {t("common.sort.list")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
