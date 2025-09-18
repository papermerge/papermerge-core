import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectUserVisibleColumns,
  userListVisibleColumnsUpdated
} from "@/features/users/storage/user"
import {usePanelMode} from "@/hooks"
import {ColumnConfig, ColumnSelector} from "kommon"
import {useTranslation} from "react-i18next"
import {UserItem} from "../types"
import userColumns from "./columns"

export default function ColumnSelectorContainer() {
  const mode = usePanelMode()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const visibleColumns = useAppSelector(s => selectUserVisibleColumns(s, mode))
  const allColumns = userColumns(t).map(c => {
    if (!visibleColumns) {
      return {...c, visible: c.visible !== false}
    }
    if (visibleColumns.length == 0) {
      return {...c, visible: c.visible !== false}
    }

    if (visibleColumns?.includes(c.key)) {
      return {...c, visible: true}
    }

    return {...c, visible: false}
  })

  const onColumnChange = (columns: ColumnConfig<UserItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(userListVisibleColumnsUpdated({mode, value: newVisibleColumns}))
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      i18NPrefix="userColumns"
      onColumnsChange={onColumnChange}
    />
  )
}
