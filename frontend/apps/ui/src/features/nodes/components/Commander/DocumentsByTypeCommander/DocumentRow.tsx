import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  currentNodeChanged,
  selectDocumentsByTypeCommanderVisibleColumns
} from "@/features/ui/uiSlice"
import {Checkbox, Table} from "@mantine/core"
import {useContext} from "react"
import {useNavigate} from "react-router-dom"

import type {DocumentCFV, PanelMode} from "@/types"

type Args = {
  doc: DocumentCFV
}

export default function DocumentRow({doc}: Args) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mode: PanelMode = useContext(PanelContext)
  const visibleColumns = useAppSelector(s =>
    selectDocumentsByTypeCommanderVisibleColumns(s, mode)
  )
  const visibleCustomFields = doc.custom_fields.filter(cf =>
    visibleColumns.includes(cf[0])
  )
  const customFieldsDataColumns = visibleCustomFields.map(cf => (
    <Table.Td key={cf[0]}>{cf[1]}</Table.Td>
  ))

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    if (e.ctrlKey || e.altKey) {
      dispatch(
        currentNodeChanged({id: doc.id, ctype: "document", panel: "secondary"})
      )
    } else {
      navigate(`/document/${doc.id}`)
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox />
      </Table.Td>
      <Table.Td>
        <a href="#" onClick={onClick}>
          {doc.title}
        </a>
      </Table.Td>
      {customFieldsDataColumns}
    </Table.Tr>
  )
}
