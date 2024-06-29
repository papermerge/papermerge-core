import {useDispatch} from "react-redux"
import {Table, Checkbox} from "@mantine/core"
import {selectionAdd, selectionRemove} from "@/slices/groups"
import type {Group} from "@/types"

type Args = {
  group: Group
}

export default function GroupRow({group}: Args) {
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(group.id))
    } else {
      dispatch(selectionRemove(group.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox onChange={onChange} />
      </Table.Td>
      <Table.Td>{group.name}</Table.Td>
    </Table.Tr>
  )
}
