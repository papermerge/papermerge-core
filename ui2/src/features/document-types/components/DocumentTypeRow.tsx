import {
  selectSelectedIds,
  selectionAdd,
  selectionRemove
} from "@/features/custom-fields/customFieldsSlice"
import type {DocType} from "@/features/document-types/types"
import {Checkbox, Table} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {Link} from "react-router-dom"

type Args = {
  documentType: DocType
}

export default function DocumentTypeRow({documentType}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(documentType.id))
    } else {
      dispatch(selectionRemove(documentType.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIds.includes(documentType.id)}
          onChange={onChange}
        />
      </Table.Td>
      <Table.Td>
        <Link to={`/document-types/${documentType.id}`}>
          {documentType.name}
        </Link>
      </Table.Td>
    </Table.Tr>
  )
}
