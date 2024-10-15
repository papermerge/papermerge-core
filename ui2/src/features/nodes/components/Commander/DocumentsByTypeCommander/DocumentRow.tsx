import {Checkbox, Table} from "@mantine/core"
import {useSelector} from "react-redux"
import {Link} from "react-router-dom"

import {selectSelectedIds} from "@/features/users/usersSlice"

import type {DocumentCFV} from "@/types"

type Args = {
  doc: DocumentCFV
}

export default function DocumentRow({doc}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const customFieldsDataColumns = doc.custom_fields.map(cf => (
    <Table.Td key={cf[0]}>{cf[1]}</Table.Td>
  ))

  const onChange = () => {}

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox checked={selectedIds.includes(doc.id)} onChange={onChange} />
      </Table.Td>
      <Table.Td>
        <Link to={`/document/${doc.id}`}>{doc.title}</Link>
      </Table.Td>
      {customFieldsDataColumns}
    </Table.Tr>
  )
}
