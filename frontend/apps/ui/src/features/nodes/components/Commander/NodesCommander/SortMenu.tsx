import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelSorting, setPanelList} from "@/features/ui/panelRegistry"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconSortAscendingLetters} from "@tabler/icons-react"
import type {SortDirection} from "kommon"
import {useTranslation} from "react-i18next"

export default function SortMenu() {
  const {panelId} = usePanel()
  const sorting = useAppSelector(s => selectPanelSorting(s, panelId))
  const {t} = useTranslation()
  const dispatch = useAppDispatch()

  const onSortColumnChanged = (column: string) => {
    dispatch(
      setPanelList({
        panelId,
        list: {
          sorting: {
            direction: sorting?.direction,
            column
          }
        }
      })
    )
  }
  const onSortDirChanged = (direction: SortDirection) => {
    dispatch(
      setPanelList({
        panelId,
        list: {
          sorting: {
            direction,
            column: sorting?.column
          }
        }
      })
    )
  }

  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon size="lg" variant="default">
          <IconSortAscendingLetters size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item
          onClick={() => onSortColumnChanged("title")}
          rightSection={sorting?.column == "title" && <IconCheck />}
        >
          {t("common.sort.title")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("ctype")}
          rightSection={sorting?.column == "ctype" && <IconCheck />}
        >
          {t("common.sort.type")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("updated_at")}
          rightSection={sorting?.column == "updated_at" && <IconCheck />}
        >
          {t("common.sort.modified")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("created_at")}
          rightSection={sorting?.column == "created_at" && <IconCheck />}
        >
          {t("common.sort.created")}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => onSortDirChanged("asc")}
          rightSection={sorting?.direction == "asc" && <IconCheck />}
        >
          A-Z
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortDirChanged("desc")}
          rightSection={sorting?.direction == "desc" && <IconCheck />}
        >
          Z-A
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
