import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  commanderSortMenuColumnUpdated,
  commanderSortMenuDirectionUpdated,
  selectCommanderSortMenuColumn,
  selectCommanderSortMenuDir
} from "@/features/ui/uiSlice"
import type {SortMenuColumn, SortMenuDirection} from "@/types"
import {ActionIcon, Menu} from "@mantine/core"
import {IconCheck, IconSortAscendingLetters} from "@tabler/icons-react"
import {useContext} from "react"
import {useTranslation} from "react-i18next"

export default function SortMenu() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode = useContext(PanelContext)
  const sortDir = useAppSelector(s => selectCommanderSortMenuDir(s, mode))
  const sortColumn = useAppSelector(s => selectCommanderSortMenuColumn(s, mode))

  const onSortColumnChanged = (column: SortMenuColumn) => {
    dispatch(commanderSortMenuColumnUpdated({mode, column}))
  }
  const onSortDirChanged = (direction: SortMenuDirection) => {
    dispatch(commanderSortMenuDirectionUpdated({mode, direction}))
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
          rightSection={sortColumn == "title" && <IconCheck />}
        >
          {t("common.sort.title")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("ctype")}
          rightSection={sortColumn == "ctype" && <IconCheck />}
        >
          {t("common.sort.type")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("updated_at")}
          rightSection={sortColumn == "updated_at" && <IconCheck />}
        >
          {t("common.sort.modified")}
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortColumnChanged("created_at")}
          rightSection={sortColumn == "created_at" && <IconCheck />}
        >
          {t("common.sort.created")}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          onClick={() => onSortDirChanged("az")}
          rightSection={sortDir == "az" && <IconCheck />}
        >
          A-Z
        </Menu.Item>
        <Menu.Item
          onClick={() => onSortDirChanged("za")}
          rightSection={sortDir == "za" && <IconCheck />}
        >
          Z-A
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
