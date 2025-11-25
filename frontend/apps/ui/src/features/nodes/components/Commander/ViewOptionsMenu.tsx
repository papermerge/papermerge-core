import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelAllCustom,
  setPanelCustomState
} from "@/features/ui/panelRegistry"
import type {ViewOption} from "@/types"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconListDetails} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

const VIEW_OPTION = "viewOption"

export default function ViewOptionsMenu() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()

  const {viewOption} = useAppSelector(s => selectPanelAllCustom(s, panelId))

  const onViewOptionsChanged = (value: ViewOption) => {
    dispatch(setPanelCustomState({panelId, key: VIEW_OPTION, value}))
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
