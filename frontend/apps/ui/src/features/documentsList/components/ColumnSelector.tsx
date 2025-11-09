import {useAppDispatch, useAppSelector} from "@/app/hooks"
import useColumns from "@/features/documentsList/hooks/useColumns"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelVisibleColumns,
  setPanelList
} from "@/features/ui/panelRegistry"
import {ActionIcon, Checkbox, Popover, ScrollArea, Stack} from "@mantine/core"
import {IconColumns} from "@tabler/icons-react"
import {TFunction} from "i18next"
import {ColumnConfig} from "kommon"
import {useState} from "react"
import {useTranslation} from "react-i18next"
import {DocumentListItem} from "../types"

export default function ColumnSelectorContainer() {
  const {panelId} = usePanel()
  const {t} = useTranslation()
  const dispatch = useAppDispatch()

  const visibleColumns = useAppSelector(s =>
    selectPanelVisibleColumns(s, panelId)
  )
  const columns = useColumns()

  const allColumns = columns.map(c => {
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

  const onColumnChange = (columns: ColumnConfig<DocumentListItem>[]) => {
    const newVisibleColumns = columns
      .filter(c => Boolean(c.visible !== false))
      .map(c => c.key)

    dispatch(
      setPanelList({
        panelId,
        list: {visibleColumns: newVisibleColumns}
      })
    )
  }

  return (
    <ColumnSelector
      t={t}
      columns={allColumns}
      onColumnsChange={onColumnChange}
    />
  )
}

const translatableColumnKey = [
  "title",
  "ID",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at"
]

interface ColumnSelectorArgs {
  columns: ColumnConfig<DocumentListItem>[]
  onColumnsChange: (columns: ColumnConfig<DocumentListItem>[]) => void
  t?: TFunction
}

function ColumnSelector({columns, onColumnsChange, t}: ColumnSelectorArgs) {
  const [opened, setOpened] = useState(false)

  const handleToggle = (columnKey: any) => {
    const newColumns = columns.map(col =>
      col.key === columnKey ? {...col, visible: !col.visible} : col
    )
    onColumnsChange(newColumns)
  }

  const columnComponents = columns.map(column => {
    if (translatableColumnKey.includes(column.key)) {
      return (
        <Checkbox
          key={String(column.key)}
          label={t?.(String(column.key)) || column.label}
          checked={column.visible !== false}
          onChange={() => handleToggle(column.key)}
          size="sm"
        />
      )
    } else {
      return (
        <Checkbox
          key={String(column.key)}
          label={column.label}
          checked={column.visible !== false}
          onChange={() => handleToggle(column.key)}
          size="sm"
        />
      )
    }
  })

  return (
    <Popover
      width={180}
      position="bottom-end"
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
    >
      <Popover.Target>
        <ActionIcon variant="light" onClick={() => setOpened(o => !o)}>
          <IconColumns size={16} />
        </ActionIcon>
      </Popover.Target>

      <Popover.Dropdown>
        <ScrollArea.Autosize mah={300}>
          <Stack gap="xs">{columnComponents}</Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  )
}
