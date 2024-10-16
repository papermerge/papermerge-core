import {
  selectSelectedIds,
  selectionAdd,
  selectionRemove
} from "@/features/custom-fields/customFieldsSlice"
import type {CustomField} from "@/types"
import {Checkbox, Table} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {Link} from "react-router-dom"

type Args = {
  customField: CustomField
}

export default function CustomFieldRow({customField}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(customField.id))
    } else {
      dispatch(selectionRemove(customField.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIds.includes(customField.id)}
          onChange={onChange}
        />
      </Table.Td>
      <Table.Td>
        <Link to={`/custom-fields/${customField.id}`}>{customField.name}</Link>
      </Table.Td>
      <Table.Td>
        <Link to={`/custom-fields/${customField.id}`}>{customField.type}</Link>
      </Table.Td>
    </Table.Tr>
  )
}
